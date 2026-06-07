import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

import { db } from "./firestore";
import type { AssignedSubject } from "../types/user";

const announcementsCollection = collection(db, "announcements");

export type AnnouncementRecord = {
  id?: string;
  title: string;
  message: string;
  targetType: "institute" | "singleSlot" | "multiSlot";
  classLevel?: string;
  batch?: string;
  subject?: string;
  multiSlots?: Array<{ classLevel: string; batch: string; subject: string }>;
  createdBy?: string;
  createdAt?: number;
};

export const addAnnouncement = async (data: AnnouncementRecord) => {
  await addDoc(announcementsCollection, {
    ...data,
    createdAt: Date.now(),
  });
};

export const getAnnouncements = async (): Promise<AnnouncementRecord[]> => {
  const snapshot = await getDocs(announcementsCollection);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as AnnouncementRecord),
  }));
};

export const getInstituteAnnouncements = async () => {
  const q = query(announcementsCollection, where("targetType", "==", "institute"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as AnnouncementRecord),
  }));
};

export const getAnnouncementsForSlot = async (slot: AssignedSubject) => {
  const all = await getAnnouncements();
  return all.filter((item) => {
    if (item.targetType === "institute") {
      return true;
    }
    if (
      item.targetType === "singleSlot" &&
      item.classLevel === slot.classLevel &&
      item.batch === slot.batch &&
      item.subject === slot.subject
    ) {
      return true;
    }
    if (item.targetType === "multiSlot" && item.multiSlots?.length) {
      return item.multiSlots.some(
        (s) =>
          s.classLevel === slot.classLevel &&
          s.batch === slot.batch &&
          s.subject === slot.subject
      );
    }
    return false;
  });
};
