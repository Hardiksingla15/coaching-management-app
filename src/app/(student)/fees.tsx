import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "../../components/ScreenContainer";
import ContextHeader from "../../components/batch/ContextHeader";
import EmptyState from "../../components/batch/EmptyState";
import { useBatchContext } from "../../context/BatchContext";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { getStudentFeeForSlot } from "../../firebase/fees";
import type { FeeRecord } from "../../types/fees";

export default function StudentFeesScreen() {
  const { activeBatch } = useBatchContext();
  const { user } = useCurrentUser();

  const [feeRecord, setFeeRecord] = useState<FeeRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeBatch || !user?.uid) {
      return;
    }

    try {
      setLoading(true);
      const record = await getStudentFeeForSlot(user.uid, activeBatch);
      setFeeRecord(record);
    } catch (error) {
      console.error("Failed to load student fee:", error);
    } finally {
      setLoading(false);
    }
  }, [activeBatch, user?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!activeBatch) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Fees 💳</Text>
        <EmptyState message="Select a subject slot on the dashboard first." />
      </ScreenContainer>
    );
  }

  // Define payment method icon
  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "cash":
        return "cash-outline";
      case "card":
        return "card-outline";
      default:
        return "globe-outline";
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Fees 💳</Text>
      <ContextHeader activeBatch={activeBatch} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : !feeRecord ? (
        <EmptyState message="No fee assigned for this subject slot yet." />
      ) : (
        <>
          {/* Status Badge */}
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.statusBadge,
                feeRecord.status === "paid" ? styles.paidBadge : styles.pendingBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  feeRecord.status === "paid" ? styles.paidText : styles.pendingText,
                ]}
              >
                {feeRecord.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.totalCard]}>
              <Text style={styles.statLabel}>Total Fee</Text>
              <Text style={styles.statVal}>₹{feeRecord.totalFee}</Text>
            </View>

            <View style={[styles.statCard, styles.paidCard]}>
              <Text style={styles.statLabel}>Paid</Text>
              <Text style={styles.statVal}>₹{feeRecord.paidAmount}</Text>
            </View>

            <View style={[styles.statCard, styles.remainingCard]}>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={[styles.statVal, feeRecord.remainingAmount > 0 && styles.pendingValueText]}>
                ₹{feeRecord.remainingAmount}
              </Text>
            </View>
          </View>

          <Text style={styles.historyTitle}>Payment History</Text>

          <FlatList
            data={feeRecord.paymentHistory || []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<EmptyState message="No payment transactions recorded yet." />}
            renderItem={({ item }) => (
              <View style={styles.logCard}>
                <View style={styles.logLeft}>
                  <Ionicons name={getMethodIcon(item.paymentMethod)} size={24} color="#64748b" />
                  <View style={styles.logTextContainer}>
                    <Text style={styles.logMethod}>
                      {item.paymentMethod.toUpperCase()}
                    </Text>
                    <Text style={styles.logDate}>{item.paymentDate}</Text>
                  </View>
                </View>

                <Text style={styles.logAmount}>+ ₹{item.amountPaid}</Text>
              </View>
            )}
          />
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#0f172a",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  paidBadge: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  pendingBadge: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  paidText: {
    color: "#16a34a",
  },
  pendingText: {
    color: "#d97706",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  totalCard: {
    backgroundColor: "#f8fafc",
  },
  paidCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  remainingCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 4,
  },
  statVal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  pendingValueText: {
    color: "#dc2626",
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 24,
  },
  logCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  logLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logTextContainer: {
    justifyContent: "center",
  },
  logMethod: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
  },
  logDate: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  logAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#16a34a",
  },
});
