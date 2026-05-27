import { collection, getDocs } from "firebase/firestore";

import { db } from "./firestore";

const attendanceCollection = collection(db, "attendance");

/** Placeholder for attendance CRUD — implemented in a later phase. */
export const getAttendanceRecords = async () => {
  const snapshot = await getDocs(attendanceCollection);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};
