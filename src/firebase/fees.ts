import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "./firestore";
import type { AssignedSubject } from "../types/user";
import type { FeeRecord, PaymentItem } from "../types/fees";
import { getSubjectSlotKey } from "../services/batchUtils";

const feesCollection = collection(db, "fees");

/** Fetch all fee records from Firestore */
export const getFees = async (): Promise<FeeRecord[]> => {
  const snapshot = await getDocs(feesCollection);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as FeeRecord),
  }));
};

/** Get the count of pending fees documents */
export const getPendingFeesCount = async (): Promise<number> => {
  const q = query(feesCollection, where("status", "==", "pending"));
  const snapshot = await getDocs(q);
  return snapshot.size;
};

/** Fetch all fee records for a specific student */
export const getStudentFees = async (studentId: string): Promise<FeeRecord[]> => {
  const q = query(feesCollection, where("studentId", "==", studentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as FeeRecord),
  }));
};

/** Fetch a single fee record for a student and a slot context */
export const getStudentFeeForSlot = async (
  studentId: string,
  slot: AssignedSubject
): Promise<FeeRecord | null> => {
  const slotKey = getSubjectSlotKey(slot);
  const docId = `${studentId}_${slotKey}`;
  const docRef = doc(db, "fees", docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...(docSnap.data() as FeeRecord),
  };
};

/** Assigns or updates a fee for a student in a slot, preserving payment data */
export const assignFeeRecord = async (
  studentId: string,
  studentName: string,
  slot: AssignedSubject,
  totalFee: number
) => {
  const slotKey = getSubjectSlotKey(slot);
  const docId = `${studentId}_${slotKey}`;
  const docRef = doc(db, "fees", docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const existing = docSnap.data() as FeeRecord;
    const paidAmount = existing.paidAmount ?? 0;
    const remainingAmount = Math.max(0, totalFee - paidAmount);
    const status = remainingAmount === 0 ? "paid" : "pending";

    await updateDoc(docRef, {
      totalFee,
      remainingAmount,
      status,
      studentName, // sync name in case it changed
    });
  } else {
    const newRecord: FeeRecord = {
      studentId,
      studentName,
      classLevel: slot.classLevel,
      batch: slot.batch,
      subject: slot.subject,
      totalFee,
      paidAmount: 0,
      remainingAmount: totalFee,
      status: totalFee === 0 ? "paid" : "pending",
      paymentHistory: [],
      createdAt: Date.now(),
    };
    await setDoc(docRef, newRecord);
  }
};

/** Deletes a fee record (e.g. when slot unassigned) */
export const deleteFeeRecord = async (studentId: string, slot: AssignedSubject) => {
  const slotKey = getSubjectSlotKey(slot);
  const docId = `${studentId}_${slotKey}`;
  const docRef = doc(db, "fees", docId);
  await deleteDoc(docRef);
};

/** Records a new payment transaction on a fee record and updates counters */
export const recordPayment = async (
  studentId: string,
  slot: AssignedSubject,
  amount: number,
  paymentMethod: string,
  recordedByUid: string
) => {
  const slotKey = getSubjectSlotKey(slot);
  const docId = `${studentId}_${slotKey}`;
  const docRef = doc(db, "fees", docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("FEE_RECORD_NOT_FOUND");
  }

  const existing = docSnap.data() as FeeRecord;
  const paymentHistory = existing.paymentHistory ?? [];
  const paidAmount = (existing.paidAmount ?? 0) + amount;
  const remainingAmount = Math.max(0, existing.totalFee - paidAmount);
  const status = remainingAmount === 0 ? "paid" : "pending";

  const newPayment: PaymentItem = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    amountPaid: amount,
    paymentDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD local format
    paymentMethod,
    recordedBy: recordedByUid,
  };

  await updateDoc(docRef, {
    paidAmount,
    remainingAmount,
    status,
    paymentHistory: [...paymentHistory, newPayment],
  });
};

/** Computes the total institute fee aggregates for the owner dashboard */
export type FeesSummaryStats = {
  totalAssigned: number;
  totalCollected: number;
  totalPending: number;
  studentsPendingCount: number;
};

export const getFeesSummary = async (): Promise<FeesSummaryStats> => {
  const allRecords = await getFees();
  
  let totalAssigned = 0;
  let totalCollected = 0;
  let totalPending = 0;
  const pendingStudentIds = new Set<string>();

  for (const record of allRecords) {
    totalAssigned += record.totalFee ?? 0;
    totalCollected += record.paidAmount ?? 0;
    totalPending += record.remainingAmount ?? 0;
    if ((record.remainingAmount ?? 0) > 0) {
      pendingStudentIds.add(record.studentId);
    }
  }

  return {
    totalAssigned,
    totalCollected,
    totalPending,
    studentsPendingCount: pendingStudentIds.size,
  };
};
