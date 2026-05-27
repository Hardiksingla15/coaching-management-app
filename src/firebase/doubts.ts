import { collection, getDocs } from "firebase/firestore";

import { db } from "./firestore";

const doubtsCollection = collection(db, "doubts");

/** Placeholder for doubts CRUD — implemented in a later phase. */
export const getDoubts = async () => {
  const snapshot = await getDocs(doubtsCollection);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};
