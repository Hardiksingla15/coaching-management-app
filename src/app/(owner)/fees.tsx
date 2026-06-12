import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

import ScreenContainer from "../../components/ScreenContainer";
import AppHeader from "../../components/AppHeader";
import EmptyState from "../../components/batch/EmptyState";
import AuthButton from "../../components/AuthButton";
import { getFees, recordPayment } from "../../firebase/fees";
import type { FeeRecord, PaymentItem } from "../../types/fees";

// Helper to get local date in YYYY-MM-DD format
function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type StudentGroup = {
  studentId: string;
  studentName: string;
  records: FeeRecord[];
  totalFee: number;
  paidAmount: number;
  remainingAmount: number;
  hasPending: boolean;
};

export default function OwnerFeesScreen() {
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid">("all");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});

  // Modal payment state
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(getLocalDateString());
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const loadFeesData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFees();
      setRecords(data);
    } catch (error) {
      console.error("Failed to load fees details:", error);
      Alert.alert("Error", "Could not load fee records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeesData();
  }, [loadFeesData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeesData();
    setRefreshing(false);
  }, [loadFeesData]);

  // Aggregate statistics for 2x2 cards
  const summary = useMemo(() => {
    let assigned = 0;
    let collected = 0;
    let pending = 0;
    let paidCount = 0;

    records.forEach((rec) => {
      assigned += rec.totalFee ?? 0;
      collected += rec.paidAmount ?? 0;
      pending += rec.remainingAmount ?? 0;
      if (rec.status === "paid") {
        paidCount++;
      }
    });

    return {
      totalAssigned: assigned,
      totalCollected: collected,
      totalPending: pending,
      totalPaidRecords: paidCount,
    };
  }, [records]);

  // Extract unique classes from fee records for filter chips
  const classFilters = useMemo(() => {
    const classes = records.map((r) => r.classLevel).filter(Boolean);
    return Array.from(new Set(classes)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [records]);

  // Client-side search and filters
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const matchesSearch =
        item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batch.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        filterStatus === "all" || item.status === filterStatus;

      const matchesClass =
        !selectedClass || item.classLevel === selectedClass;

      return matchesSearch && matchesStatus && matchesClass;
    });
  }, [records, searchQuery, filterStatus, selectedClass]);

  // Group filtered records student-wise
  const groupedStudents = useMemo(() => {
    const groupsMap: Record<string, StudentGroup> = {};

    filteredRecords.forEach((rec) => {
      if (!groupsMap[rec.studentId]) {
        groupsMap[rec.studentId] = {
          studentId: rec.studentId,
          studentName: rec.studentName,
          records: [],
          totalFee: 0,
          paidAmount: 0,
          remainingAmount: 0,
          hasPending: false,
        };
      }

      const group = groupsMap[rec.studentId];
      group.records.push(rec);
      group.totalFee += rec.totalFee ?? 0;
      group.paidAmount += rec.paidAmount ?? 0;
      group.remainingAmount += rec.remainingAmount ?? 0;
      if (rec.status === "pending") {
        group.hasPending = true;
      }
    });

    return Object.values(groupsMap).sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [filteredRecords]);

  const toggleExpand = (studentId: string) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const openPaymentModal = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setPaymentAmount(String(fee.remainingAmount));
    setPaymentMethod("cash");
    setPaymentDate(getLocalDateString());
  };

  const handleReceivePayment = async () => {
    if (!selectedFee) {
      return;
    }

    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a payment amount greater than zero.");
      return;
    }

    if (amount > selectedFee.remainingAmount) {
      Alert.alert(
        "Excess Amount",
        `Payment amount exceeds the remaining balance of ₹${selectedFee.remainingAmount}.`
      );
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(paymentDate)) {
      Alert.alert("Invalid Date", "Please enter date in YYYY-MM-DD format.");
      return;
    }

    try {
      setSubmittingPayment(true);
      await recordPayment(
        selectedFee.studentId,
        {
          classLevel: selectedFee.classLevel,
          batch: selectedFee.batch,
          subject: selectedFee.subject,
        },
        amount,
        paymentMethod,
        "owner_admin" // In MVP, owner registers payments directly
      );

      Alert.alert("Success", "Payment recorded successfully!");
      setSelectedFee(null);
      loadFeesData();
    } catch (error) {
      console.error("Failed to record payment:", error);
      Alert.alert("Error", "Could not record payment transaction.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const renderStudentGroup = ({ item }: { item: StudentGroup }) => {
    const isExpanded = !!expandedStudents[item.studentId];

    return (
      <View style={styles.groupCard}>
        {/* Student Group Header */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleExpand(item.studentId)}
          style={[styles.groupHeader, isExpanded && styles.groupHeaderActive]}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.studentName}>{item.studentName}</Text>
            <View style={styles.groupMetaRow}>
              <Text style={styles.metaText}>Assigned: ₹{item.totalFee}</Text>
              <Text style={[styles.metaText, styles.greenText]}>Paid: ₹{item.paidAmount}</Text>
              {item.remainingAmount > 0 && (
                <Text style={[styles.metaText, styles.redText]}>Pending: ₹{item.remainingAmount}</Text>
              )}
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={[
                styles.statusBadge,
                !item.hasPending ? styles.paidBadge : styles.pendingBadge,
                { minWidth: 80, paddingVertical: 4, paddingHorizontal: 8 }
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  !item.hasPending ? styles.paidBadgeText : styles.pendingBadgeText,
                ]}
              >
                {!item.hasPending ? "PAID" : "PENDING"}
              </Text>
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#64748b"
            />
          </View>
        </TouchableOpacity>

        {/* Expanded Subject Slots List */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {item.records.map((rec) => (
              <View
                key={rec.id || `${rec.studentId}_${rec.subject}`}
                style={styles.subjectRow}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.subjectTitle}>
                    Class {rec.classLevel} · {rec.subject}
                  </Text>
                  <Text style={styles.subjectTiming}>
                    Timing: {rec.batch}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                    <Text style={styles.subjectMetaText}>Total: ₹{rec.totalFee}</Text>
                    <Text style={[styles.subjectMetaText, styles.greenText]}>Paid: ₹{rec.paidAmount}</Text>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <TouchableOpacity
                    onPress={() => openPaymentModal(rec)}
                    style={[
                      styles.statusBadge,
                      rec.status === "paid" ? styles.paidBadge : styles.pendingBadge,
                      { paddingVertical: 6, paddingHorizontal: 10 }
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        rec.status === "paid" ? styles.paidBadgeText : styles.pendingBadgeText,
                        { fontSize: 11 }
                      ]}
                    >
                      {rec.status === "paid" ? "PAID" : `Collect ₹${rec.remainingAmount}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer>
      <AppHeader title="Fees Management 💳" showBack={true} showLogout={false} />

      {/* Aggregates Summary Dashboard (2x2 Grid) */}
      <View style={styles.summaryGrid}>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Assigned</Text>
            <Text style={styles.summaryValue}>₹{summary.totalAssigned}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, styles.greenText]}>Total Collected</Text>
            <Text style={[styles.summaryValue, styles.greenText]}>₹{summary.totalCollected}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, styles.redText]}>Pending Amount</Text>
            <Text style={[styles.summaryValue, styles.redText]}>₹{summary.totalPending}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, styles.blueText]}>Paid Records</Text>
            <Text style={[styles.summaryValue, styles.blueText]}>{summary.totalPaidRecords}</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search student, subject, or slot..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter Chips */}
      <View style={styles.filterContainer}>
        {(["all", "pending", "paid"] as const).map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setFilterStatus(status)}
            style={[
              styles.filterChip,
              filterStatus === status && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                filterStatus === status && styles.filterChipTextActive,
              ]}
            >
              {status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Class Filter Chips */}
      {classFilters.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedClass(null)}
              style={[
                styles.filterChip,
                selectedClass === null && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedClass === null && styles.filterChipTextActive,
                ]}
              >
                ALL CLASSES
              </Text>
            </TouchableOpacity>
            {classFilters.map((cls) => (
              <TouchableOpacity
                key={cls}
                onPress={() => setSelectedClass(cls)}
                style={[
                  styles.filterChip,
                  selectedClass === cls && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedClass === cls && styles.filterChipTextActive,
                  ]}
                >
                  CLASS {cls}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      ) : groupedStudents.length === 0 ? (
        <EmptyState message="No matching fee invoices found." />
      ) : (
        <FlatList
          data={groupedStudents}
          keyExtractor={(item) => item.studentId}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={renderStudentGroup}
        />
      )}


      {/* Payment Receipt Modal */}
      {selectedFee && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedFee(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Receipt Details</Text>
                <TouchableOpacity onPress={() => setSelectedFee(null)}>
                  <Ionicons name="close" size={24} color="#0f172a" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody}>
                <View style={styles.studentDetailHeader}>
                  <Text style={styles.detailName}>{selectedFee.studentName}</Text>
                  <Text style={styles.detailSlot}>
                    Class {selectedFee.classLevel} · {selectedFee.batch} · {selectedFee.subject}
                  </Text>
                </View>

                {/* Balance Summary Card */}
                <View style={styles.balanceSummary}>
                  <View style={styles.balanceCol}>
                    <Text style={styles.balanceLabel}>Total Assigned</Text>
                    <Text style={styles.balanceVal}>₹{selectedFee.totalFee}</Text>
                  </View>
                  <View style={styles.balanceCol}>
                    <Text style={[styles.balanceLabel, styles.greenText]}>Total Paid</Text>
                    <Text style={[styles.balanceVal, styles.greenText]}>₹{selectedFee.paidAmount}</Text>
                  </View>
                  <View style={styles.balanceCol}>
                    <Text style={[styles.balanceLabel, styles.redText]}>Pending</Text>
                    <Text style={[styles.balanceVal, styles.redText]}>₹{selectedFee.remainingAmount}</Text>
                  </View>
                </View>

                {/* Form to Receive Payment (Only if pending) */}
                {selectedFee.remainingAmount > 0 ? (
                  <View style={styles.paymentForm}>
                    <Text style={styles.sectionTitle}>Record Payment</Text>
                    
                    <Text style={styles.inputLabel}>Amount (₹):</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={paymentAmount}
                      onChangeText={setPaymentAmount}
                      placeholder="Enter amount"
                    />

                    <Text style={styles.inputLabel}>Payment Method:</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={paymentMethod}
                        onValueChange={(val) => setPaymentMethod(val)}
                      >
                        <Picker.Item label="Cash" value="cash" />
                        <Picker.Item label="Online Transfer (UPI/Net)" value="online" />
                        <Picker.Item label="Card Payment" value="card" />
                      </Picker>
                    </View>

                    <Text style={styles.inputLabel}>Payment Date (YYYY-MM-DD):</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={paymentDate}
                      onChangeText={setPaymentDate}
                      maxLength={10}
                    />

                    <AuthButton
                      title={submittingPayment ? "Recording..." : "Submit Payment"}
                      disabled={submittingPayment}
                      onPress={handleReceivePayment}
                    />
                  </View>
                ) : (
                  <View style={styles.fullyPaidLabel}>
                    <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                    <Text style={styles.fullyPaidText}>This slot is fully paid.</Text>
                  </View>
                )}

                {/* Payment History timeline */}
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Payment History</Text>
                {(!selectedFee.paymentHistory || selectedFee.paymentHistory.length === 0) ? (
                  <Text style={styles.emptyHistoryText}>No payments logged yet.</Text>
                ) : (
                  selectedFee.paymentHistory.map((item: PaymentItem, idx: number) => (
                    <View key={item.id || idx} style={styles.historyCard}>
                      <View style={styles.historyLeft}>
                        <Text style={styles.historyDate}>{item.paymentDate}</Text>
                        <Text style={styles.historyMethod}>Via {item.paymentMethod.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.historyAmount}>+ ₹{item.amountPaid}</Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterChipActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  filterChipTextActive: {
    color: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingBottom: 24,
  },
  feeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  feeInfo: {
    flex: 1,
    marginRight: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  slotDetails: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  feeAmounts: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  amountText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  collectedText: {
    color: "#16a34a",
  },
  statusCol: {
    alignItems: "center",
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  paidBadge: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  paidBadgeText: {
    color: "#16a34a",
    fontWeight: "bold",
    fontSize: 12,
  },
  pendingBadge: {
    backgroundColor: "#fff7ed",
    borderColor: "#ffedd5",
  },
  pendingBadgeText: {
    color: "#c2410c",
    fontWeight: "bold",
    fontSize: 12,
  },
  actionPrompt: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3b82f6",
    marginTop: 4,
    textTransform: "uppercase",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  modalBody: {
    padding: 16,
  },
  studentDetailHeader: {
    marginBottom: 16,
  },
  detailName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  detailSlot: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  balanceSummary: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginBottom: 16,
  },
  balanceCol: {
    flex: 1,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
  },
  balanceVal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 4,
  },
  greenText: {
    color: "#16a34a",
  },
  redText: {
    color: "#dc2626",
  },
  blueText: {
    color: "#2563eb",
  },
  paymentForm: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: "#0f172a",
  },
  pickerContainer: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    overflow: "hidden",
  },
  fullyPaidLabel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    gap: 8,
  },
  fullyPaidText: {
    color: "#16a34a",
    fontWeight: "bold",
    fontSize: 15,
  },
  emptyHistoryText: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 12,
  },
  historyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  historyLeft: {
    flexDirection: "column",
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  historyMethod: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#16a34a",
  },
  summaryGrid: {
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 4,
  },
  groupCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: "hidden",
  },
  groupHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  groupHeaderActive: {
    backgroundColor: "#f8fafc",
  },
  groupMetaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: "#64748b",
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#fdfdfd",
  },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  subjectTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  subjectTiming: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  subjectMetaText: {
    fontSize: 12,
    color: "#475569",
  },
});
