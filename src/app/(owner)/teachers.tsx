import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { useCallback, useState, useMemo } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "../../components/ScreenContainer";
import AuthButton from "../../components/AuthButton";
import { formatBatchShort } from "../../services/batchUtils";
import { getAcademicStructures } from "../../firebase/academic";
import { getAllTeachables } from "../../firebase/firestore";
import type { AcademicStructure } from "../../types/academic";
import type { UserProfileWithId } from "../../types/user";

function getTeachingSlotsForUser(
  userId: string,
  structures: AcademicStructure[]
) {
  return structures.filter((slot) => slot.assignedTeacherId === userId);
}

export default function OwnerTeachersScreen() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<UserProfileWithId[]>([]);
  const [structures, setStructures] = useState<AcademicStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTeachers = async () => {
    try {
      const [teachables, academicStructures] = await Promise.all([
        getAllTeachables(),
        getAcademicStructures(),
      ]);
      setTeachers(teachables as UserProfileWithId[]);
      setStructures(academicStructures);
    } catch {
      console.log("Failed to fetch teachers");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTeachers();
    }, [])
  );

  const filteredTeachers = useMemo(() => {
    return teachers.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.mobile.toLowerCase().includes(q)
      );
    });
  }, [teachers, searchQuery]);

  if (loading) {
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
        Teachers (Owner included) 👨‍🏫
      </Text>

      <AuthButton
        title="Create Teacher"
        onPress={() =>
          router.push({
            pathname: "/(owner)/manage-teacher" as never,
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
        data={filteredTeachers}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 16 }}
        renderItem={({ item }) => {
          const teachingSlots = getTeachingSlotsForUser(item.id, structures);

          return (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(owner)/manage-teacher" as never,
                  params: { id: item.id },
                })
              }
              style={{
                backgroundColor: "#f5f5f5",
                padding: 15,
                borderRadius: 10,
                marginBottom: 15,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.name}</Text>
              <Text style={{ marginTop: 5, color: "gray" }}>{item.mobile}</Text>
              <Text style={{ marginTop: 10, fontWeight: "600" }}>Teaching slots:</Text>
              {teachingSlots.length ? (
                teachingSlots.map((slot) => (
                  <Text key={slot.id}>
                    · Class {slot.classLevel} · {formatBatchShort(slot)}
                  </Text>
                ))
              ) : (
                <Text style={{ color: "gray" }}>Not assigned</Text>
              )}
            </TouchableOpacity>
          );
        }}
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

