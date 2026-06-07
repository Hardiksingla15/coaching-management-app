import { collection, addDoc, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";

import { db } from "./firestore";
import type { AcademicStructure } from "../types/academic";

export const addAcademicStructure = async (
  data: Omit<AcademicStructure, "id">
) => {
  const existing = await getAcademicStructures();
  const duplicate = existing.some(
    (s) =>
      s.classLevel === data.classLevel &&
      s.batch === data.batch &&
      s.subject === data.subject
  );

  if (duplicate) {
    throw new Error("DUPLICATE_STRUCTURE");
  }

  await addDoc(collection(db, "academicStructure"), {
    ...data,
    assignedTeacherId: data.assignedTeacherId ?? "",
    assignedTeacherName: data.assignedTeacherName ?? "",
    createdAt: Date.now(),
  });
};

export const getAcademicStructures = async (): Promise<AcademicStructure[]> => {
  const snapshot = await getDocs(collection(db, "academicStructure"));

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<AcademicStructure, "id">),
  }));
};

export const updateAcademicStructure = async (
  id: string,
  data: Partial<Omit<AcademicStructure, "id">>
) => {
  await updateDoc(doc(db, "academicStructure", id), data);
};

export const deleteAcademicStructure = async (id: string) => {
  await deleteDoc(doc(db, "academicStructure", id));
};
