import type { AcademicStructure } from "../types/academic";
import type { AssignedSubject, UserProfile, UserRole } from "../types/user";
import {
  dedupeAssignedSubjects,
  getSubjectSlotKey,
  subjectSlotsEqual,
} from "./batchUtils";

export type SubjectSlot = Pick<
  AssignedSubject,
  "classLevel" | "batch" | "subject"
>;

/** Teaching slots for teachers/owners — never store teacherId/teacherName. */
export function toTeachingSlot(slot: SubjectSlot): AssignedSubject {
  return {
    classLevel: slot.classLevel.trim(),
    batch: slot.batch.trim(),
    subject: slot.subject.trim(),
  };
}

/** Student slots include assigned teacher from academic structure. */
export function toStudentSlot(
  slot: SubjectSlot,
  structure?: Pick<
    AcademicStructure,
    "assignedTeacherId" | "assignedTeacherName"
  >
): AssignedSubject {
  const base = toTeachingSlot(slot);
  if (!structure?.assignedTeacherId) {
    return base;
  }
  return {
    ...base,
    teacherId: structure.assignedTeacherId,
    teacherName: structure.assignedTeacherName ?? "",
  };
}

export function sanitizeAssignedSubjectsForRole(
  role: UserRole,
  slots: AssignedSubject[],
  structures: AcademicStructure[] = []
): AssignedSubject[] {
  const structureMap = new Map(
    structures.map((s) => [getSubjectSlotKey(s), s])
  );

  const normalized = slots.map((slot) => {
    const key = getSubjectSlotKey(slot);
    const structure = structureMap.get(key);

    if (role === "student") {
      return toStudentSlot(slot, structure);
    }

    return toTeachingSlot(slot);
  });

  return dedupeAssignedSubjects(normalized);
}

export function findUsersWithSlot(
  users: Array<{ id: string } & UserProfile>,
  slot: SubjectSlot
) {
  return users.filter((user) =>
    (user.assignedSubjects ?? []).some((s) => subjectSlotsEqual(s, slot))
  );
}
