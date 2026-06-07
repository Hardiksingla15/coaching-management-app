import {
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

import { getAcademicStructures, updateAcademicStructure } from "./academic";
import { db, getAllTeachables, getUsersByRole, updateUserData } from "./firestore";
import type { AcademicStructure } from "../types/academic";
import type { AssignedSubject, UserProfile } from "../types/user";
import {
  dedupeAssignedSubjects,
  getSubjectSlotKey,
  normalizeAssignedSubject,
  normalizeUserAssignedSubjects,
  subjectSlotsEqual,
} from "../services/batchUtils";
import {
  type SubjectSlot,
  findUsersWithSlot,
  sanitizeAssignedSubjectsForRole,
  toStudentSlot,
  toTeachingSlot,
} from "../services/subjectSlotSync";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

async function writeUserAssignedSubjects(
  userId: string,
  assignedSubjects: AssignedSubject[]
) {
  const cleaned = assignedSubjects.map((slot) => normalizeAssignedSubject(slot));
  await updateUserData(userId, { assignedSubjects: cleaned });
}

/** Rebuild every teacher/owner assignedSubjects from academicStructure assignments. */
export async function syncAllTeachableSlotsFromStructure() {
  const [structures, teachables] = await Promise.all([
    getAcademicStructures(),
    getAllTeachables(),
  ]);

  const slotsByTeacherId = new Map<string, AssignedSubject[]>();

  for (const structure of structures) {
    if (!structure.assignedTeacherId) {
      continue;
    }

    const list = slotsByTeacherId.get(structure.assignedTeacherId) ?? [];
    list.push(toTeachingSlot(structure));
    slotsByTeacherId.set(structure.assignedTeacherId, list);
  }

  const { failed, errors } = await runUserUpdates(
    teachables.map((teacher) => () => {
      const slots = dedupeAssignedSubjects(
        slotsByTeacherId.get(teacher.id) ?? []
      );

      return writeUserAssignedSubjects(
        teacher.id,
        sanitizeAssignedSubjectsForRole(teacher.role, slots)
      );
    })
  );

  if (failed > 0) {
    throw new Error(
      `Could not sync ${failed} teacher profile(s). ${errors[0] ?? ""}`
    );
  }
}

/** Refresh teacherId/teacherName on student slots from academicStructure. */
export async function syncStudentTeacherFieldsFromStructure() {
  const [structures, students] = await Promise.all([
    getAcademicStructures(),
    getUsersByRole("student"),
  ]);

  const structureMap = new Map(
    structures.map((structure) => [getSubjectSlotKey(structure), structure])
  );

  const { failed, errors } = await runUserUpdates(
    students.map((student) => () => {
      const updated = (student.assignedSubjects ?? []).map((slot) => {
        const structure = structureMap.get(getSubjectSlotKey(slot));
        if (!structure) {
          return slot;
        }
        return toStudentSlot(slot, structure);
      });

      return writeUserAssignedSubjects(
        student.id,
        dedupeAssignedSubjects(updated)
      );
    })
  );

  if (failed > 0) {
    throw new Error(
      `Could not sync ${failed} student profile(s). ${errors[0] ?? ""}`
    );
  }
}

async function removeSlotFromStudents(slot: SubjectSlot) {
  const students = await getUsersByRole("student");
  const slotKey = getSubjectSlotKey(
    normalizeAssignedSubject({
      classLevel: slot.classLevel,
      batch: slot.batch,
      subject: slot.subject,
    })
  );
  const affected = students.filter((student) =>
    (student.assignedSubjects ?? []).some(
      (s) => getSubjectSlotKey(normalizeAssignedSubject(s)) === slotKey
    )
  );

  const { failed, errors } = await runUserUpdates(
    affected.map(
      (student) => () =>
        writeUserAssignedSubjects(
          student.id,
          (student.assignedSubjects ?? []).filter(
            (s) => getSubjectSlotKey(normalizeAssignedSubject(s)) !== slotKey
          )
        )
    )
  );

  if (failed > 0) {
    throw new Error(
      `Could not update ${failed} student profile(s). ${errors[0] ?? ""}`
    );
  }
}

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, "users", userId));
  if (!snapshot.exists()) {
    return null;
  }
  const data = snapshot.data() as UserProfile;
  return {
    ...data,
    assignedSubjects: normalizeUserAssignedSubjects(data),
  };
}

async function getAllUserProfiles(): Promise<
  Array<{ id: string } & UserProfile>
> {
  const [students, teachers, owners] = await Promise.all([
    getUsersByRole("student"),
    getUsersByRole("teacher"),
    getUsersByRole("owner"),
  ]);

  return [...students, ...teachers, ...owners];
}

async function runUserUpdates(
  updates: Array<() => Promise<void>>
): Promise<{ failed: number; errors: string[] }> {
  const results = await Promise.allSettled(updates.map((fn) => fn()));
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => getErrorMessage(r.reason));

  return { failed: errors.length, errors };
}

export async function addTeachingSlotToUser(
  userId: string,
  slot: SubjectSlot
) {
  const user = await getUserProfile(userId);
  if (!user) {
    throw new Error("Assigned teacher profile not found");
  }

  const teachingSlot = toTeachingSlot(slot);
  const next = dedupeAssignedSubjects([
    ...(user.assignedSubjects ?? []),
    teachingSlot,
  ]);

  await writeUserAssignedSubjects(
    userId,
    sanitizeAssignedSubjectsForRole(user.role, next)
  );
}

export async function removeTeachingSlotFromUser(
  userId: string,
  slot: SubjectSlot
) {
  const user = await getUserProfile(userId);
  if (!user) {
    return;
  }

  const next = (user.assignedSubjects ?? []).filter(
    (s) => !subjectSlotsEqual(s, slot)
  );

  await writeUserAssignedSubjects(userId, next);
}

export async function removeSlotFromAllUsers(slot: SubjectSlot) {
  const users = await getAllUserProfiles();
  const affected = findUsersWithSlot(users, slot);

  const { failed, errors } = await runUserUpdates(
    affected.map(
      (user) => () =>
        writeUserAssignedSubjects(
          user.id,
          (user.assignedSubjects ?? []).filter(
            (s) => !subjectSlotsEqual(s, slot)
          )
        )
    )
  );

  if (failed > 0) {
    throw new Error(
      `Could not update ${failed} user profile(s). ${errors[0] ?? ""}`
    );
  }
}

export async function replaceSlotForAllUsers(
  oldSlot: SubjectSlot,
  newSlot: SubjectSlot,
  structure?: AcademicStructure
) {
  const users = await getAllUserProfiles();
  const students = users.filter((user) => user.role === "student");
  const affected = findUsersWithSlot(students, oldSlot);

  const { failed, errors } = await runUserUpdates(
    affected.map((user) => () => {
      const updated = (user.assignedSubjects ?? []).map((s) => {
        if (!subjectSlotsEqual(s, oldSlot)) {
          return s;
        }
        return toStudentSlot(newSlot, structure);
      });

      return writeUserAssignedSubjects(
        user.id,
        dedupeAssignedSubjects(updated)
      );
    })
  );

  if (failed > 0) {
    throw new Error(
      `Could not update ${failed} student profile(s). ${errors[0] ?? ""}`
    );
  }
}

export async function syncTeacherOnSlotChange(
  oldSlot: SubjectSlot,
  newSlot: SubjectSlot,
  oldTeacherId: string | undefined,
  newTeacherId: string | undefined
) {
  if (oldTeacherId) {
    await removeTeachingSlotFromUser(oldTeacherId, oldSlot);
    if (!subjectSlotsEqual(oldSlot, newSlot)) {
      await removeTeachingSlotFromUser(oldTeacherId, newSlot);
    }
  }

  if (newTeacherId) {
    await addTeachingSlotToUser(newTeacherId, newSlot);
  }
}

/** Keep user profiles aligned after academicStructure create/edit. */
export async function syncUsersAfterStructureChange(
  oldSlot: SubjectSlot | null,
  newSlot: SubjectSlot,
  structure: AcademicStructure
) {
  if (oldSlot) {
    await replaceSlotForAllUsers(oldSlot, newSlot, structure);
  }

  await syncAllTeachableSlotsFromStructure();
  await syncStudentTeacherFieldsFromStructure();
}

export async function deleteSubjectSlotEverywhere(slot: AcademicStructure) {
  if (!slot.id) {
    throw new Error("Slot id missing — could not delete");
  }

  const slotKey: SubjectSlot = {
    classLevel: slot.classLevel.trim(),
    batch: slot.batch.trim(),
    subject: slot.subject.trim(),
  };

  await deleteDoc(doc(db, "academicStructure", slot.id));

  const cleanupErrors: string[] = [];

  try {
    await syncAllTeachableSlotsFromStructure();
  } catch (error) {
    cleanupErrors.push(getErrorMessage(error));
  }

  try {
    await removeSlotFromStudents(slotKey);
  } catch (error) {
    cleanupErrors.push(getErrorMessage(error));
  }

  if (cleanupErrors.length > 0) {
    throw new Error(
      `Slot deleted, but some profiles could not be updated.\n${cleanupErrors[0]}`
    );
  }
}

export async function clearTeacherFromAllSlots(teacherId: string) {
  const structures = await getAcademicStructures();
  const assigned = structures.filter((s) => s.assignedTeacherId === teacherId);

  await Promise.all(
    assigned.map((s) =>
      updateAcademicStructure(s.id, {
        assignedTeacherId: "",
        assignedTeacherName: "",
      })
    )
  );
}

export async function deleteUserAndCleanup(
  userId: string,
  role: UserProfile["role"]
) {
  if (role === "teacher" || role === "owner") {
    await clearTeacherFromAllSlots(userId);
  }

  const user = await getUserProfile(userId);
  if (user?.assignedSubjects?.length) {
    for (const slot of user.assignedSubjects) {
      await removeSlotFromAllUsers(slot);
    }
  }

  await deleteDoc(doc(db, "users", userId));
}
