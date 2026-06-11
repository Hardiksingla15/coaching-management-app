export type PaymentItem = {
  id: string;            // unique identifier (e.g. uuid or timestamp)
  amountPaid: number;    // amount received in this transaction
  paymentDate: string;   // YYYY-MM-DD
  paymentMethod: string; // "cash" | "online" | "card"
  recordedBy: string;    // UID of the owner who received it
};

export type FeeRecord = {
  id?: string;           // studentId_slotKey
  studentId: string;
  studentName: string;   // denormalized student name for search queries
  classLevel: string;
  batch: string;
  subject: string;
  totalFee: number;      // total subject-specific fee
  paidAmount: number;    // cumulative sum of payments
  remainingAmount: number; // totalFee - paidAmount
  status: "pending" | "paid"; // calculated dynamically
  paymentHistory: PaymentItem[];
  createdAt: number;
};
