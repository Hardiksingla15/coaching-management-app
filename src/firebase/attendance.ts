import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

import { db } from "./firestore";
import type { AssignedSubject } from "../types/user";

const attendanceCollection = collection(db, "attendance");

export type AttendanceRecord = {
  id?: string;
  studentId: string;
  classLevel: string;
  batch: string;
  subject: string;
  date: string;
  status: "present" | "absent";
  markedBy: string;
  createdAt?: number;
};

/** Starter foundation for subject-slot attendance. */
export const markAttendance = async (record: AttendanceRecord) => {
  await addDoc(attendanceCollection, {
    ...record,
    createdAt: Date.now(),
  });
};

export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  const snapshot = await getDocs(attendanceCollection);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as AttendanceRecord),
  }));
};

export const getAttendanceForSlot = async (slot: AssignedSubject) => {
  const q = query(
    attendanceCollection,
    where("classLevel", "==", slot.classLevel),
    where("batch", "==", slot.batch),
    where("subject", "==", slot.subject)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as AttendanceRecord),
  }));
};
