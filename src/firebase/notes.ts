import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "./firestore";

export const addNote = async (data: Record<string, unknown>) => {
  await addDoc(collection(db, "notes"), {
    ...data,
    createdAt: Date.now(),
  });
};

export const getNotes = async () => {
  const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};
