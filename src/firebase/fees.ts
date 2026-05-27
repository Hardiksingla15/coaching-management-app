import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "./firestore";

const feesCollection = collection(db, "fees");

/** Placeholder for fees CRUD — implemented in a later phase. */
export const getFees = async () => {
  const snapshot = await getDocs(feesCollection);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

export const getPendingFeesCount = async () => {
  const q = query(feesCollection, where("status", "==", "pending"));
  const snapshot = await getDocs(q);
  return snapshot.size;
};
