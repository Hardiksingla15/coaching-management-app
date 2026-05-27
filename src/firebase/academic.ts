import { collection, addDoc, getDocs } from "firebase/firestore";

import { db } from "./firestore";
import type { AcademicStructure } from "../types/academic";

export const addAcademicStructure = async (
  data: Omit<AcademicStructure, "id">
) => {
  const existing = await getAcademicStructures();
  const duplicate = existing.some(
    (s) => s.classLevel === data.classLevel && s.batch === data.batch
  );

  if (duplicate) {
    throw new Error("DUPLICATE_STRUCTURE");
  }

  await addDoc(collection(db, "academicStructure"), {
    ...data,
    subjects: data.subjects ?? [],
    assignedTeachers: data.assignedTeachers ?? [],
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
