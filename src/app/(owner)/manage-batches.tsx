import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useCallback, useState, useMemo } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "../../components/ScreenContainer";
import AppHeader from "../../components/AppHeader";
import CustomInput from "../../components/CustomInput";
import AuthButton from "../../components/AuthButton";
import {
  addAcademicStructure,
  updateAcademicStructure,
} from "../../firebase/academic";
import { useAcademicContext } from "../../context/AcademicContext";
import { getAllTeachables } from "../../firebase/firestore";
import {
  deleteSubjectSlotEverywhere,
  syncUsersAfterStructureChange,
} from "../../firebase/subjectSlotSync";
import { groupAcademicByClass } from "../../services/academicGrouping";
import type { AcademicStructure } from "../../types/academic";
import type { SubjectSlot } from "../../services/subjectSlotSync";
import type { UserProfileWithId } from "../../types/user";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong";
}

function slotLabel(slot: SubjectSlot) {
  return `Class ${slot.classLevel} · ${slot.batch} · ${slot.subject}`;
}

function showResultAlert(title: string, message: string) {
  Alert.alert(title, message);
}

type StatusMessage = {
  type: "success" | "error";
  title: string;
  message: string;
};

export default function ManageBatches() {
  const router = useRouter();
  const [classLevel, setClassLevel] = useState("");
  const [batch, setBatch] = useState("");
  const [subject, setSubject] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [originalSlot, setOriginalSlot] = useState<SubjectSlot | null>(null);
  const [teachers, setTeachers] = useState<UserProfileWithId[]>([]);
  const { structures, loading: cacheLoading, refresh } = useAcademicContext();
  const [busy, setBusy] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AcademicStructure | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchStructures(), refresh()]);
    setRefreshing(false);
  }, [refresh]);


  const showStatus = (type: StatusMessage["type"], title: string, message: string) => {
    setStatusMessage({ type, title, message });
    showResultAlert(title, message);
  };

  const fetchStructures = async () => {
    setListLoading(true);
    try {
      const teachables = await getAllTeachables();
      setTeachers(teachables as UserProfileWithId[]);
    } catch (error) {
      Alert.alert(
        "Load failed",
        `Could not refresh teachable list.\n\n${getErrorMessage(error)}`
      );
    } finally {
      setListLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStructures();
    }, [])
  );

  const resetForm = () => {
    setClassLevel("");
    setBatch("");
    setSubject("");
    setTeacherId("");
    setEditingSlotId(null);
    setOriginalSlot(null);
  };

  const handleSave = async () => {
    if (busy) {
      return;
    }

    if (!classLevel.trim() || !batch.trim() || !subject.trim()) {
      Alert.alert("Missing fields", "Please fill class, batch timing, and subject.");
      return;
    }

    const newSlot: SubjectSlot = {
      classLevel: classLevel.trim(),
      batch: batch.trim(),
      subject: subject.trim(),
    };

    const selectedTeacher = teachers.find((t) => t.id === teacherId);
    const isEdit = Boolean(editingSlotId && originalSlot);

    if (isEdit) {
      const duplicate = structures.some(
        (s) =>
          s.id !== editingSlotId &&
          s.classLevel === newSlot.classLevel &&
          s.batch === newSlot.batch &&
          s.subject === newSlot.subject
      );

      if (duplicate) {
        Alert.alert(
          "Duplicate slot",
          "This class + batch + subject combination already exists."
        );
        return;
      }
    }

    setBusy(true);

    let resultTitle = "";
    let resultMessage = "";
    let resultType: StatusMessage["type"] = "success";

    try {
      if (isEdit && editingSlotId && originalSlot) {
        const updatedStructure: AcademicStructure = {
          id: editingSlotId,
          ...newSlot,
          assignedTeacherId: teacherId || "",
          assignedTeacherName: selectedTeacher?.name || "",
        };

        await updateAcademicStructure(editingSlotId, {
          classLevel: newSlot.classLevel,
          batch: newSlot.batch,
          subject: newSlot.subject,
          assignedTeacherId: teacherId || "",
          assignedTeacherName: selectedTeacher?.name || "",
        });

        await syncUsersAfterStructureChange(
          originalSlot,
          newSlot,
          updatedStructure
        );
        await refresh();

        resetForm();
        resultTitle = "Updated successfully";
        resultMessage = `Subject slot updated:\n${slotLabel(newSlot)}${
          selectedTeacher ? `\nTeacher: ${selectedTeacher.name}` : ""
        }`;
      } else {
        await addAcademicStructure({
          classLevel: newSlot.classLevel,
          batch: newSlot.batch,
          subject: newSlot.subject,
          assignedTeacherId: teacherId || undefined,
          assignedTeacherName: selectedTeacher?.name || undefined,
        });

        await syncUsersAfterStructureChange(null, newSlot, {
          id: "",
          ...newSlot,
          assignedTeacherId: teacherId || "",
          assignedTeacherName: selectedTeacher?.name || "",
        });
        await refresh();

        resetForm();
        resultTitle = "Added successfully";
        resultMessage = `Subject slot created:\n${slotLabel(newSlot)}${
          selectedTeacher ? `\nTeacher: ${selectedTeacher.name}` : ""
        }`;
      }
    } catch (error: unknown) {
      resultType = "error";
      if (error instanceof Error && error.message === "DUPLICATE_STRUCTURE") {
        resultTitle = "Duplicate slot";
        resultMessage =
          "This class + batch + subject combination already exists.";
      } else {
        resultTitle = isEdit ? "Update failed" : "Add failed";
        resultMessage = getErrorMessage(error);
      }
    } finally {
      setBusy(false);
    }

    void fetchStructures();

    if (resultTitle) {
      showStatus(resultType, resultTitle, resultMessage);
    }
  };

  const handleEditSlot = (slot: AcademicStructure) => {
    if (busy) {
      return;
    }

    setEditingSlotId(slot.id);
    setOriginalSlot({
      classLevel: slot.classLevel,
      batch: slot.batch,
      subject: slot.subject,
    });
    setClassLevel(slot.classLevel);
    setBatch(slot.batch);
    setSubject(slot.subject);
    setTeacherId(slot.assignedTeacherId ?? "");
  };

  const handleDeleteSlot = (slot: AcademicStructure) => {
    if (busy) {
      return;
    }

    setStatusMessage(null);
    setPendingDelete(slot);
  };

  const cancelDelete = () => {
    setPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete || busy) {
      return;
    }

    const slot = pendingDelete;
    setPendingDelete(null);
    setBusy(true);

    let resultTitle = "";
    let resultMessage = "";
    let resultType: StatusMessage["type"] = "success";

    try {
      await deleteSubjectSlotEverywhere(slot);
      await refresh();

      if (editingSlotId === slot.id) {
        resetForm();
      }

      resultTitle = "Deleted successfully";
      resultMessage = `Removed subject slot:\n${slotLabel({
        classLevel: slot.classLevel,
        batch: slot.batch,
        subject: slot.subject,
      })}`;
    } catch (error) {
      const message = getErrorMessage(error);

      if (message.includes("Slot deleted, but")) {
        resultType = "success";
        resultTitle = "Deleted with warnings";
        resultMessage = message;
      } else {
        resultType = "error";
        resultTitle = "Delete failed";
        resultMessage = message;
      }
    } finally {
      setBusy(false);
    }

    void fetchStructures();

    if (resultTitle) {
      showStatus(resultType, resultTitle, resultMessage);
    }
  };

  const filteredStructures = useMemo(() => {
    return structures.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.classLevel.toLowerCase().includes(q) ||
        item.batch.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        (item.assignedTeacherName && item.assignedTeacherName.toLowerCase().includes(q))
      );
    });
  }, [structures, searchQuery]);

  const grouped = useMemo(() => groupAcademicByClass(filteredStructures), [filteredStructures]);

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pendingDelete ? (
          <View
            style={{
              backgroundColor: "#fff3cd",
              borderColor: "#ffc107",
              borderWidth: 1,
              borderRadius: 10,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 6 }}>
              Delete this subject slot?
            </Text>
            <Text style={{ color: "#333", marginBottom: 12 }}>
              {slotLabel({
                classLevel: pendingDelete.classLevel,
                batch: pendingDelete.batch,
                subject: pendingDelete.subject,
              })}
              {"\n"}This removes it from all students and teachers.
            </Text>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={cancelDelete}
                disabled={busy}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#e5e7eb",
                  marginRight: 12,
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontWeight: "700", color: "#374151" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void confirmDelete()}
                disabled={busy}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: busy ? "#ddd" : "#dc2626",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontWeight: "700", color: "#fff" }}>
                  {busy ? "Deleting..." : "Yes, Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {statusMessage ? (
          <View
            style={{
              backgroundColor:
                statusMessage.type === "success" ? "#e6f7ed" : "#fdecea",
              borderColor:
                statusMessage.type === "success" ? "#28a745" : "#dc3545",
              borderWidth: 1,
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontWeight: "700",
                color:
                  statusMessage.type === "success" ? "#1e7e34" : "#c0392b",
              }}
            >
              {statusMessage.title}
            </Text>
            <Text style={{ marginTop: 4, color: "#333" }}>
              {statusMessage.message}
            </Text>
          </View>
        ) : null}

        <AppHeader title="Manage Slots 🎓" showLogout={false} />

        {editingSlotId ? (
          <Text style={{ marginBottom: 12, color: "#555" }}>
            Editing slot — press Save Changes when done
          </Text>
        ) : null}

        {busy ? (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <ActivityIndicator size="small" />
            <Text style={{ marginLeft: 10, color: "#555" }}>Please wait...</Text>
          </View>
        ) : null}

        <CustomInput
          placeholder="Class (e.g. 11)"
          value={classLevel}
          onChangeText={setClassLevel}
        />

        <CustomInput
          placeholder="Batch timing (e.g. 6am-7am)"
          value={batch}
          onChangeText={setBatch}
        />

        <CustomInput
          placeholder="Subject (e.g. Physics)"
          value={subject}
          onChangeText={setSubject}
        />

        <View
          style={{
            backgroundColor: "#f5f5f5",
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          <Picker
            enabled={!busy}
            selectedValue={teacherId}
            onValueChange={(value) => setTeacherId(value)}
          >
            <Picker.Item
              label="Assign teacher (owner included) - optional"
              value=""
            />
            {teachers.map((teacher) => (
              <Picker.Item
                key={teacher.id}
                label={`${teacher.name} (${teacher.role})`}
                value={teacher.id}
              />
            ))}
          </Picker>
        </View>

        <AuthButton
          title={
            busy
              ? "Please wait..."
              : editingSlotId
                ? "Save Changes"
                : "Add Subject Slot"
          }
          disabled={busy}
          onPress={handleSave}
        />

        {editingSlotId ? (
          <AuthButton
            title="Cancel Edit"
            disabled={busy}
            onPress={resetForm}
          />
        ) : null}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search class, timing, subject, teacher..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {listLoading || cacheLoading ? (
          <ActivityIndicator style={{ marginTop: 16 }} size="large" />
        ) : null}

        {grouped.length === 0 && !listLoading ? (
          <Text style={{ color: "gray", marginTop: 20 }}>
            No subject slots yet.
          </Text>
        ) : (
          grouped.map((group) => (
            <View key={group.classLevel} style={{ marginTop: 20 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                Class {group.classLevel}
              </Text>

              {group.batches.map((item) => (
                <View
                  key={item.id}
                  style={{
                    backgroundColor:
                      editingSlotId === item.id ? "#e8f4ff" : "#f5f5f5",
                    padding: 15,
                    borderRadius: 10,
                    marginBottom: 10,
                    marginLeft: 8,
                  }}
                >
                  <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                    {item.batch} · {item.subject}
                  </Text>
                  <Text style={{ marginTop: 6 }}>
                    Teacher: {item.assignedTeacherName || "Not assigned"}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 12,
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        router.push({
                          pathname: "/(owner)/attendance" as never,
                          params: {
                            classLevel: item.classLevel,
                            batch: item.batch,
                            subject: item.subject,
                          },
                        })
                      }
                      disabled={busy}
                      style={{
                        minHeight: 44,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor: busy ? "#ddd" : "#e2e8f0",
                        marginRight: 12,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          fontSize: 15,
                          color: busy ? "#888" : "#475569",
                        }}
                      >
                        Attendance
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleEditSlot(item)}
                      disabled={busy}
                      style={{
                        minHeight: 44,
                        minWidth: 72,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor: busy ? "#ddd" : "#dbeafe",
                        marginRight: 12,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          fontSize: 16,
                          color: busy ? "#888" : "#1d4ed8",
                        }}
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleDeleteSlot(item)}
                      disabled={busy}
                      style={{
                        minHeight: 44,
                        minWidth: 88,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor: busy ? "#ddd" : "#fee2e2",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          fontSize: 16,
                          color: busy ? "#888" : "#b91c1c",
                        }}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
  },
});

