import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "../../components/ScreenContainer";
import ContextHeader from "../../components/batch/ContextHeader";
import EmptyState from "../../components/batch/EmptyState";
import AuthButton from "../../components/AuthButton";
import { useBatchContext } from "../../context/BatchContext";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import {
  getStudentsInSlot,
  getAttendanceForDateAndSlot,
  markAttendance,
  type AttendanceRecord,
} from "../../firebase/attendance";

// Helper to get local date in YYYY-MM-DD format
function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type StudentItem = {
  id: string;
  name: string;
  mobile: string;
  status: "present" | "absent";
};

export default function TeacherAttendanceScreen() {
  const { activeBatch } = useBatchContext();
  const { user } = useCurrentUser();
  
  const [date, setDate] = useState(getLocalDateString());
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeBatch) {
      return;
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return;
    }

    try {
      setLoading(true);
      const studentProfiles = await getStudentsInSlot(activeBatch);
      const existingAttendance = await getAttendanceForDateAndSlot(activeBatch, date);

      const attendanceMap = new Map(
        existingAttendance.map((rec) => [rec.studentId, rec.status])
      );

      const items: StudentItem[] = studentProfiles.map((student) => ({
        id: student.id,
        name: student.name,
        mobile: student.mobile,
        status: attendanceMap.get(student.id) ?? "present", // Default to present for MVP
      }));

      setStudents(items);
    } catch (error) {
      console.error("Failed to load attendance details:", error);
      Alert.alert("Error", "Could not load students or attendance records.");
    } finally {
      setLoading(false);
    }
  }, [activeBatch, date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleStatus = (studentId: string) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) {
          return student;
        }
        return {
          ...student,
          status: student.status === "present" ? "absent" : "present",
        };
      })
    );
  };

  const handleSave = async () => {
    if (!activeBatch || !user) {
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert("Invalid Date", "Please enter date in YYYY-MM-DD format.");
      return;
    }

    try {
      setSaving(true);
      
      const promises = students.map((student) => {
        const record: AttendanceRecord = {
          studentId: student.id,
          classLevel: activeBatch.classLevel,
          batch: activeBatch.batch,
          subject: activeBatch.subject,
          date,
          status: student.status,
          markedBy: user.uid || "unknown",
        };
        return markAttendance(record);
      });

      await Promise.all(promises);
      Alert.alert("Success", "Attendance saved successfully!");
      loadData();
    } catch (error) {
      console.error("Failed to save attendance:", error);
      Alert.alert("Error", "Could not save attendance records.");
    } finally {
      setSaving(false);
    }
  };

  if (!activeBatch) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Attendance 📅</Text>
        <EmptyState message="Select a subject slot on the dashboard first." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Attendance 📅</Text>
      <ContextHeader activeBatch={activeBatch} />

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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1d4ed8" />
        </View>
      ) : students.length === 0 ? (
        <EmptyState message="No students are currently assigned to this subject slot." />
      ) : (
        <>
          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentMobile}>{item.mobile}</Text>
                </View>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() => toggleStatus(item.id)}
                    style={[
                      styles.statusButton,
                      item.status === "present" ? styles.presentButton : styles.absentButton,
                    ]}
                  >
                    <Ionicons
                      name={item.status === "present" ? "checkmark-circle" : "close-circle"}
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.statusButtonText}>
                      {item.status.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <View style={styles.footer}>
            <AuthButton
              title={saving ? "Saving..." : "Save Attendance"}
              disabled={saving}
              onPress={handleSave}
            />
          </View>
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
    color: "#1e293b",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingBottom: 80,
  },
  studentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  actionButtons: {
    flexDirection: "row",
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: "center",
    gap: 4,
  },
  presentButton: {
    backgroundColor: "#16a34a",
  },
  absentButton: {
    backgroundColor: "#dc2626",
  },
  statusButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
});
