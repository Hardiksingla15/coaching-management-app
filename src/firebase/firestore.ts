import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { app } from "./config";
import type { UserProfile, UserRole } from "../types/user";
import { normalizeUserBatches } from "../services/batchUtils";

export const db = getFirestore(app);

export const saveUserData = async (
  uid: string,
  data: Partial<UserProfile>
) => {
  await setDoc(doc(db, "users", uid), data, { merge: true });
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
    assignedBatches: normalizeUserBatches(data),
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
    assignedBatches: normalizeUserBatches(data),
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
      assignedBatches: normalizeUserBatches(data),
    };
  });
};

export const getAllStudents = async () => getUsersByRole("student");

export const getAllTeachers = async () => getUsersByRole("teacher");

export const updateUserData = async (
  id: string,
  data: Partial<UserProfile>
) => {
  await updateDoc(doc(db, "users", id), data);
};

/** @deprecated Use updateUserData */
export const updateStudentData = updateUserData;

export const deleteUserProfile = async (id: string) => {
  await deleteDoc(doc(db, "users", id));
};

export type InstituteStats = {
  totalStudents: number;
  totalTeachers: number;
  pendingFees: number;
};

export const getInstituteStats = async (): Promise<InstituteStats> => {
  const { getPendingFeesCount } = await import("./fees");

  const [students, teachers, pendingFees] = await Promise.all([
    getAllStudents(),
    getAllTeachers(),
    getPendingFeesCount().catch(() => 0),
  ]);

  return {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    pendingFees,
  };
};
