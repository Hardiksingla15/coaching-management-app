import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";

import { db } from "./firestore";
import type { AssignedSubject } from "../types/user";
import { getSubjectSlotKey } from "../services/batchUtils";

const attendanceCollection = collection(db, "attendance");

export type AttendanceRecord = {
  id?: string;
  studentId: string;
  classLevel: string;
  batch: string;
  subject: string;
  date: string; // YYYY-MM-DD
  status: "present" | "absent";
  markedBy: string;
  createdAt?: number;
};

/** Get all students assigned to a specific subject slot using query optimization */
export const getStudentsInSlot = async (slot: AssignedSubject) => {
  const slotKey = getSubjectSlotKey(slot);
  const q = query(
    collection(db, "users"),
    where("role", "==", "student"),
    where("assignedSlotKeys", "array-contains", slotKey)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as any),
  }));
};

/** Saves or updates an attendance record using the deterministic document ID format: studentId_slotKey_date */
export const markAttendance = async (record: AttendanceRecord) => {
  const slotKey = getSubjectSlotKey({
    classLevel: record.classLevel,
    batch: record.batch,
    subject: record.subject,
  });
  const docId = `${record.studentId}_${slotKey}_${record.date}`;
  await setDoc(doc(db, "attendance", docId), {
    ...record,
    createdAt: record.createdAt ?? Date.now(),
  });
};

/** Retrieves attendance records for a specific date and slot */
export const getAttendanceForDateAndSlot = async (
  slot: AssignedSubject,
  date: string
): Promise<AttendanceRecord[]> => {
  const q = query(
    attendanceCollection,
    where("classLevel", "==", slot.classLevel),
    where("batch", "==", slot.batch),
    where("subject", "==", slot.subject),
    where("date", "==", date)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as AttendanceRecord),
  }));
};

/** Retrieves historical attendance records for a specific student and slot */
export const getStudentAttendanceForSlot = async (
  studentId: string,
  slot: AssignedSubject
): Promise<AttendanceRecord[]> => {
  const q = query(
    attendanceCollection,
    where("studentId", "==", studentId),
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
