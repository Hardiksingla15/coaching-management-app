import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "../../components/ScreenContainer";
import ContextHeader from "../../components/batch/ContextHeader";
import EmptyState from "../../components/batch/EmptyState";
import { useBatchContext } from "../../context/BatchContext";
import {
  getStudentsInSlot,
  getAttendanceForDateAndSlot,
} from "../../firebase/attendance";

// Helper to get local date in YYYY-MM-DD format
function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type StudentLog = {
  id: string;
  name: string;
  mobile: string;
  status: "present" | "absent" | "unmarked";
};

export default function OwnerAttendanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    classLevel?: string;
    batch?: string;
    subject?: string;
  }>();

  const { activeBatch } = useBatchContext();

  const slot = useMemo(() => {
    const hasParams = params.classLevel && params.batch && params.subject;
    return hasParams
      ? {
          classLevel: params.classLevel!,
          batch: params.batch!,
          subject: params.subject!,
        }
      : activeBatch;
  }, [params.classLevel, params.batch, params.subject, activeBatch]);

  const [date, setDate] = useState(getLocalDateString());
  const [logs, setLogs] = useState<StudentLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAttendance = useCallback(async () => {
    if (!slot) {
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return;
    }

    try {
      setLoading(true);
      const studentProfiles = await getStudentsInSlot(slot);
      const attendanceRecords = await getAttendanceForDateAndSlot(slot, date);

      const statusMap = new Map(
        attendanceRecords.map((r) => [r.studentId, r.status])
      );

      const studentLogs: StudentLog[] = studentProfiles.map((student) => ({
        id: student.id,
        name: student.name,
        mobile: student.mobile,
        status: statusMap.get(student.id) ?? "unmarked",
      }));

      setLogs(studentLogs);
    } catch (error) {
      console.error("Failed to load attendance logs for owner:", error);
    } finally {
      setLoading(false);
    }
  }, [slot, date]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  if (!slot) {
    return (
      <ScreenContainer>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.title}>Slot Attendance</Text>
        </View>
        <EmptyState message="No subject slot specified." />
      </ScreenContainer>
    );
  }

  // Stats calculation
  const totalCount = logs.length;
  const presentCount = logs.filter((l) => l.status === "present").length;
  const absentCount = logs.filter((l) => l.status === "absent").length;
  const unmarkedCount = logs.filter((l) => l.status === "unmarked").length;

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Slot Attendance</Text>
      </View>

      <ContextHeader activeBatch={slot} />

      <View style={styles.dateSelectorContainer}>
        <Text style={styles.dateLabel}>Date (YYYY-MM-DD):</Text>
        <TextInput
          style={styles.dateInput}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      {/* Summary Chips */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryChip, styles.totalChip]}>
          <Text style={styles.summaryChipText}>Total: {totalCount}</Text>
        </View>
        <View style={[styles.summaryChip, styles.presentChip]}>
          <Text style={[styles.summaryChipText, styles.presentChipText]}>
            Present: {presentCount}
          </Text>
        </View>
        <View style={[styles.summaryChip, styles.absentChip]}>
          <Text style={[styles.summaryChipText, styles.absentChipText]}>
            Absent: {absentCount}
          </Text>
        </View>
        {unmarkedCount > 0 && (
          <View style={[styles.summaryChip, styles.unmarkedChip]}>
            <Text style={[styles.summaryChipText, styles.unmarkedChipText]}>
              Unmarked: {unmarkedCount}
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      ) : logs.length === 0 ? (
        <EmptyState message="No students assigned to this subject slot." />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentMobile}>{item.mobile}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  item.status === "present"
                    ? styles.presentBadge
                    : item.status === "absent"
                    ? styles.absentBadge
                    : styles.unmarkedBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    item.status === "present"
                      ? styles.presentBadgeText
                      : item.status === "absent"
                      ? styles.absentBadgeText
                      : styles.unmarkedBadgeText,
                  ]}
                >
                  {item.status === "unmarked" ? "NOT MARKED" : item.status.toUpperCase()}
                </Text>
              </View>
            </View>
          )}
        />
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
  dateSelectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
    marginRight: 10,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    textAlign: "center",
  },
  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  summaryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  summaryChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  totalChip: {
    backgroundColor: "#e2e8f0",
  },
  presentChip: {
    backgroundColor: "#dcfce7",
  },
  presentChipText: {
    color: "#15803d",
  },
  absentChip: {
    backgroundColor: "#fee2e2",
  },
  absentChipText: {
    color: "#b91c1c",
  },
  unmarkedChip: {
    backgroundColor: "#f1f5f9",
  },
  unmarkedChipText: {
    color: "#64748b",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingBottom: 24,
  },
  logCard: {
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
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  studentMobile: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
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
    fontWeight: "bold",
    fontSize: 12,
  },
  presentBadge: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  presentBadgeText: {
    color: "#16a34a",
    fontWeight: "bold",
    fontSize: 12,
  },
  absentBadge: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  absentBadgeText: {
    color: "#dc2626",
    fontWeight: "bold",
    fontSize: 12,
  },
  unmarkedBadge: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  unmarkedBadgeText: {
    color: "#64748b",
    fontWeight: "bold",
    fontSize: 12,
  },
});
