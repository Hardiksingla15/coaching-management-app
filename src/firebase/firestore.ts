import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteField,
} from "firebase/firestore";

import { app } from "./config";
import type { UserProfile, UserRole } from "../types/user";
import { normalizeUserAssignedSubjects, getSubjectSlotKey } from "../services/batchUtils";

export const db = getFirestore(app);

export const saveUserData = async (
  uid: string,
  data: Partial<UserProfile>
) => {
  const updates: Partial<UserProfile> = { ...data };
  if (data.assignedSubjects) {
    updates.assignedSlotKeys = data.assignedSubjects.map(getSubjectSlotKey);
  }

  await setDoc(
    doc(db, "users", uid),
    {
      ...updates,
      // ensure legacy fields don't keep reappearing on fresh writes
      assignedBatches: deleteField(),
      classLevel: deleteField(),
      batch: deleteField(),
      subjects: deleteField(),
    },
    { merge: true }
  );
};

export const getUserData = async (
  uid: string
): Promise<UserProfile | undefined> => {
  const snapshot = await getDoc(doc(db, "users", uid));
  const data = snapshot.data() as UserProfile | undefined;

  if (!data) {
    return undefined;
  }

  return {
    ...data,
    assignedSubjects: normalizeUserAssignedSubjects(data),
  };
};

export const getUserByMobile = async (
  mobile: string
): Promise<UserProfile | null> => {
  const q = query(
    collection(db, "users"),
    where("mobile", "==", mobile)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const data = querySnapshot.docs[0].data() as UserProfile;
  return {
    ...data,
    assignedSubjects: normalizeUserAssignedSubjects(data),
  };
};

export const getUsersByRole = async (role: UserRole) => {
  const q = query(collection(db, "users"), where("role", "==", role));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as UserProfile;
    return {
      id: docSnap.id,
      ...data,
      assignedSubjects: normalizeUserAssignedSubjects(data),
    };
  });
};

export const getAllStudents = async () => getUsersByRole("student");

export const getAllTeachers = async () => getUsersByRole("teacher");

/** Teachers list for slot assignment (teachers + owners). */
export const getAllTeachables = async () => {
  const [teachers, owners] = await Promise.all([
    getUsersByRole("teacher"),
    getUsersByRole("owner"),
  ]);
  return [...teachers, ...owners];
};

export const updateUserData = async (
  id: string,
  data: Partial<UserProfile>
) => {
  const updates: Partial<UserProfile> = { ...data };
  if (data.assignedSubjects) {
    updates.assignedSlotKeys = data.assignedSubjects.map(getSubjectSlotKey);
  }

  await updateDoc(doc(db, "users", id), {
    ...updates,
    // hard cleanup so Firestore doesn't keep showing old batch fields
    assignedBatches: deleteField(),
    classLevel: deleteField(),
    batch: deleteField(),
    subjects: deleteField(),
  });
};

/** @deprecated Use updateUserData */
export const updateStudentData = updateUserData;

/** @deprecated use addTeachingSlotToUser from subjectSlotSync */
export const addAssignedSubjectToUser = async (
  userId: string,
  slot: NonNullable<UserProfile["assignedSubjects"]>[number]
) => {
  const { addTeachingSlotToUser } = await import("./subjectSlotSync");
  await addTeachingSlotToUser(userId, slot);
};

/** @deprecated use removeTeachingSlotFromUser from subjectSlotSync */
export const removeAssignedSubjectFromUser = async (
  userId: string,
  slot: NonNullable<UserProfile["assignedSubjects"]>[number]
) => {
  const { removeTeachingSlotFromUser } = await import("./subjectSlotSync");
  await removeTeachingSlotFromUser(userId, slot);
};

export const deleteUserProfile = async (id: string) => {
  const user = await getUserData(id);
  const { deleteUserAndCleanup } = await import("./subjectSlotSync");
  await deleteUserAndCleanup(id, user?.role ?? "student");
};

export type InstituteStats = {
  totalStudents: number;
  totalTeachers: number;
  pendingFees: number;
};

export const getInstituteStats = async (): Promise<InstituteStats> => {
  const { getPendingFeesCount } = await import("./fees");

  const [students, teachables, pendingFees] = await Promise.all([
    getAllStudents(),
    getAllTeachables(),
    getPendingFeesCount().catch(() => 0),
  ]);

  return {
    totalStudents: students.length,
    totalTeachers: teachables.length,
    pendingFees,
  };
};
