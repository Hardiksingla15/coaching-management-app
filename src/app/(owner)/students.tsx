import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import React, { useCallback, useState, useMemo } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "../../components/ScreenContainer";
import AuthButton from "../../components/AuthButton";
import { formatBatchShort, getSubjectSlotKey } from "../../services/batchUtils";
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
const StudentCard = React.memo(({ item, slots, onPress }: {
  item: UserProfileWithId;
  slots: ReturnType<typeof enrichStudentSlots>;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "#f5f5f5",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.name}</Text>
      <Text style={{ marginTop: 5, color: "gray" }}>{item.mobile}</Text>
      <Text style={{ marginTop: 10, fontWeight: "600" }}>Subject slots:</Text>
      {slots.length ? (
        slots.map((batch) => (
          <Text key={`${batch.classLevel}-${batch.batch}-${batch.subject}`}>
            · {formatBatchShort(batch)}
            {batch.teacherName ? ` · ${batch.teacherName}` : ""}
          </Text>
        ))
      ) : (
        <Text style={{ color: "gray" }}>Not assigned</Text>
      )}
    </TouchableOpacity>
  );
});

export default function OwnerStudentsScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<UserProfileWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { structures, loading: cacheLoading } = useAcademicContext();

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

  const filteredStudents = useMemo(() => {
    return students.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.mobile.toLowerCase().includes(q)
      );
    });
  }, [students, searchQuery]);

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
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 12,
        }}
      >
        Students 👨‍🎓
      </Text>

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

      <FlatList
        data={studentsWithSlots}
        keyExtractor={({ item }) => item.id}
        style={{ marginTop: 16 }}
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

