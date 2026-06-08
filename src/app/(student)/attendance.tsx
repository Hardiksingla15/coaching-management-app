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
import {
  getStudentAttendanceForSlot,
  type AttendanceRecord,
} from "../../firebase/attendance";

export default function StudentAttendanceScreen() {
  const { activeBatch } = useBatchContext();
  const { user } = useCurrentUser();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeBatch || !user?.uid) {
      return;
    }

    try {
      setLoading(true);
      const data = await getStudentAttendanceForSlot(user.uid, activeBatch);
      // Sort records by date descending
      const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
      setRecords(sorted);
    } catch (error) {
      console.error("Failed to load student attendance:", error);
    } finally {
      setLoading(false);
    }
  }, [activeBatch, user?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculations
  const total = records.length;
  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = total - presentCount;
  const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  if (!activeBatch) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Attendance 👨‍🎓</Text>
        <EmptyState message="Select a subject slot on the dashboard first." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Attendance 👨‍🎓</Text>
      <ContextHeader activeBatch={activeBatch} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <>
          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.percentageCard}>
              <Text style={styles.percentageVal}>{total > 0 ? `${percentage}%` : "--"}</Text>
              <Text style={styles.percentageLabel}>Attendance</Text>
            </View>

            <View style={styles.countsContainer}>
              <View style={[styles.countCard, styles.presentCard]}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.countVal}>{presentCount}</Text>
                <Text style={styles.countLabel}>Present</Text>
              </View>

              <View style={[styles.countCard, styles.absentCard]}>
                <Ionicons name="close-circle" size={20} color="#dc2626" />
                <Text style={styles.countVal}>{absentCount}</Text>
                <Text style={styles.countLabel}>Absent</Text>
              </View>
            </View>
          </View>

          <Text style={styles.historyTitle}>Attendance Logs</Text>

          <FlatList
            data={records}
            keyExtractor={(item) => item.id || `${item.studentId}_${item.date}`}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<EmptyState message="No attendance records found for this slot yet." />}
            renderItem={({ item }) => (
              <View style={styles.logCard}>
                <View style={styles.logDateContainer}>
                  <Ionicons name="calendar-outline" size={18} color="#64748b" />
                  <Text style={styles.logDate}>{item.date}</Text>
                </View>
                
                <View
                  style={[
                    styles.badge,
                    item.status === "present" ? styles.presentBadge : styles.absentBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      item.status === "present" ? styles.presentText : styles.absentText,
                    ]}
                  >
                    {item.status.toUpperCase()}
                  </Text>
                </View>
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
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    marginTop: 8,
  },
  percentageCard: {
    flex: 1.2,
    backgroundColor: "#f0f9ff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  percentageVal: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0369a1",
  },
  percentageLabel: {
    fontSize: 13,
    color: "#0284c7",
    fontWeight: "600",
    marginTop: 4,
  },
  countsContainer: {
    flex: 1.8,
    gap: 8,
  },
  countCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 8,
  },
  presentCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  absentCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  countVal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginLeft: "auto",
  },
  countLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 24,
  },
  logCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  logDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logDate: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  presentBadge: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  absentBadge: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  presentText: {
    color: "#16a34a",
  },
  absentText: {
    color: "#dc2626",
  },
});
