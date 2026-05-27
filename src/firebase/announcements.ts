import { collection, getDocs } from "firebase/firestore";

import { db } from "./firestore";

const announcementsCollection = collection(db, "announcements");

/** Placeholder for announcements CRUD — implemented in a later phase. */
export const getAnnouncements = async () => {
  const snapshot = await getDocs(announcementsCollection);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};
