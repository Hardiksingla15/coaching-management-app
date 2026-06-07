import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "./firestore";
import type { AssignedSubject } from "../types/user";

export type NoteRecord = {
  id?: string;
  title: string;
  description: string;
  classLevel: string;
  batch: string;
  subject: string;
  uploadedBy?: string;
  uploadedAt?: number;
  createdAt?: number;
  pdfUrl?: string;
};

export const addNote = async (data: NoteRecord) => {
  const now = Date.now();
  await addDoc(collection(db, "notes"), {
    ...data,
    uploadedAt: data.uploadedAt ?? now,
    createdAt: now,
  });
};

export const getNotes = async (): Promise<NoteRecord[]> => {
  const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as NoteRecord),
  }));
};

export const getNotesForSlot = async (slot: AssignedSubject) => {
  const notes = await getNotes();
  return notes.filter(
    (note) =>
      note.classLevel === slot.classLevel &&
      note.batch === slot.batch &&
      note.subject === slot.subject
  );
};
