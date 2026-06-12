import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import React, { useCallback, useState, useMemo } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "../../components/ScreenContainer";
import AppHeader from "../../components/AppHeader";
import AuthButton from "../../components/AuthButton";
import { getSubjectSlotKey } from "../../services/batchUtils";
import { getAllStudents } from "../../firebase/firestore";
import { toStudentSlot } from "../../services/subjectSlotSync";
import { useAcademicContext } from "../../context/AcademicContext";
import type { AcademicStructure } from "../../types/academic";
import type { AssignedSubject, UserProfileWithId } from "../../types/user";

function enrichStudentSlots(
  slots: AssignedSubject[] | undefined,
  structures: AcademicStructure[]
) {
  const structureMap = new Map(
    structures.map((structure) => [getSubjectSlotKey(structure), structure])
  );

  return (slots ?? []).map((slot) => {
    const structure = structureMap.get(getSubjectSlotKey(slot));
    return structure ? toStudentSlot(slot, structure) : slot;
  });
}

// Memoized student list item card
const StudentCard = React.memo(function StudentCard({ item, slots, onPress }: {
  item: UserProfileWithId;
  slots: ReturnType<typeof enrichStudentSlots>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: "#ffffff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#0f172a" }}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </View>
      <Text style={{ marginTop: 4, color: "#64748b", fontSize: 14 }}>{item.mobile}</Text>
      
      <Text style={{ marginTop: 12, fontWeight: "600", fontSize: 13, color: "#475569" }}>
        Assigned Subjects:
      </Text>
      {slots.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {slots.map((batch, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: "#f0f9ff",
                borderColor: "#bae6fd",
                borderWidth: 1,
                borderRadius: 8,
                paddingVertical: 6,
                paddingHorizontal: 10,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#0369a1" }}>
                Class {batch.classLevel} · {batch.subject}
              </Text>
              <Text style={{ fontSize: 11, color: "#0ea5e9", marginTop: 2 }}>
                Timing: {batch.batch}
              </Text>
              {batch.teacherName && (
                <Text style={{ fontSize: 11, color: "#475569", marginTop: 2, fontStyle: "italic" }}>
                  Teacher: {batch.teacherName}
                </Text>
              )}
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ color: "#94a3b8", fontStyle: "italic", marginTop: 4, fontSize: 13 }}>
          No subject slots assigned
        </Text>
      )}
    </TouchableOpacity>
  );
});
StudentCard.displayName = "StudentCard";

export default function OwnerStudentsScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<UserProfileWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const { structures, loading: cacheLoading, refresh } = useAcademicContext();

  const fetchStudents = async () => {
    try {
      const data = await getAllStudents();
      setStudents(data as UserProfileWithId[]);
    } catch {
      console.log("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchStudents();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchStudents(), refresh()]);
    setRefreshing(false);
  }, [refresh]);

  const classesList = useMemo(() => {
    const cls = structures.map((s) => s.classLevel).filter(Boolean);
    return Array.from(new Set(cls)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [structures]);

  const subjectsList = useMemo(() => {
    const sbj = structures.map((s) => s.subject).filter(Boolean);
    return Array.from(new Set(sbj)).sort();
  }, [structures]);

  const filteredStudents = useMemo(() => {
    return students.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.mobile.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (selectedClass) {
        const hasClass = (item.assignedSubjects ?? []).some(
          (sub) => sub.classLevel === selectedClass
        );
        if (!hasClass) return false;
      }

      if (selectedSubject) {
        const hasSubject = (item.assignedSubjects ?? []).some(
          (sub) => sub.subject === selectedSubject
        );
        if (!hasSubject) return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedClass, selectedSubject]);

  // Precompute slots to avoid calculating them inside renderItem
  const studentsWithSlots = useMemo(() => {
    return filteredStudents.map((item) => ({
      item,
      slots: enrichStudentSlots(item.assignedSubjects, structures),
    }));
  }, [filteredStudents, structures]);

  if (loading || cacheLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader title="Students 👨‍🎓" showLogout={false} />

      <AuthButton
        title="Create Student"
        onPress={() =>
          router.push({
            pathname: "/(owner)/manage-student" as never,
            params: { mode: "create" },
          })
        }
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or mobile..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Class Filter Chips */}
      <View style={{ marginTop: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#64748b", marginBottom: 6 }}>Class:</Text>
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
              All Classes
            </Text>
          </TouchableOpacity>
          {classesList.map((cls) => (
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
                Class {cls}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Subject Filter Chips */}
      <View style={{ marginTop: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#64748b", marginBottom: 6 }}>Subject:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedSubject(null)}
            style={[
              styles.filterChip,
              selectedSubject === null && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedSubject === null && styles.filterChipTextActive,
              ]}
            >
              All Subjects
            </Text>
          </TouchableOpacity>
          {subjectsList.map((sbj) => (
            <TouchableOpacity
              key={sbj}
              onPress={() => setSelectedSubject(sbj)}
              style={[
                styles.filterChip,
                selectedSubject === sbj && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedSubject === sbj && styles.filterChipTextActive,
                ]}
              >
                {sbj}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={studentsWithSlots}
        keyExtractor={({ item }) => item.id}
        style={{ marginTop: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item: { item, slots } }) => (
          <StudentCard
            item={item}
            slots={slots}
            onPress={() =>
              router.push({
                pathname: "/(owner)/manage-student" as never,
                params: { id: item.id },
              })
            }
          />
        )}
      />
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
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
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
});

