import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
} from "react-native";
import React, { useCallback, useState, useMemo } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "../../components/ScreenContainer";
import AppHeader from "../../components/AppHeader";
import AuthButton from "../../components/AuthButton";
import { getAllTeachables } from "../../firebase/firestore";
import { useAcademicContext } from "../../context/AcademicContext";
import type { AcademicStructure } from "../../types/academic";
import type { UserProfileWithId } from "../../types/user";

function getTeachingSlotsForUser(
  userId: string,
  structures: AcademicStructure[]
) {
  return structures.filter((slot) => slot.assignedTeacherId === userId);
}

// Memoized teacher list item card
const TeacherCard = React.memo(function TeacherCard({ item, teachingSlots, onPress }: {
  item: UserProfileWithId;
  teachingSlots: ReturnType<typeof getTeachingSlotsForUser>;
  onPress: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View
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
      {/* Top Header Row: Name & Mobile, plus Edit button */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setExpanded(prev => !prev)}
          style={{ flex: 1 }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#0f172a" }}>{item.name}</Text>
          <Text style={{ marginTop: 4, color: "#64748b", fontSize: 14 }}>{item.mobile}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPress}
          style={{
            backgroundColor: "#f1f5f9",
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#cbd5e1",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569" }}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Slots Section */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setExpanded(prev => !prev)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
        }}
      >
        <Text style={{ fontWeight: "600", fontSize: 13, color: "#475569" }}>
          {teachingSlots.length} assigned slot{teachingSlots.length === 1 ? "" : "s"}
        </Text>
        {teachingSlots.length > 0 && (
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#64748b"
          />
        )}
      </TouchableOpacity>

      {expanded && teachingSlots.length > 0 && (
        <View style={{ gap: 6, marginTop: 10, paddingLeft: 8 }}>
          {teachingSlots.map((slot) => (
            <View
              key={slot.id}
              style={{
                backgroundColor: "#f0fdf4",
                borderColor: "#bbf7d0",
                borderWidth: 1,
                borderRadius: 8,
                paddingVertical: 6,
                paddingHorizontal: 10,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#166534" }}>
                Class {slot.classLevel} · {slot.subject}
              </Text>
              <Text style={{ fontSize: 11, color: "#15803d", marginTop: 2 }}>
                Timing: {slot.batch}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});
TeacherCard.displayName = "TeacherCard";

export default function OwnerTeachersScreen() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<UserProfileWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { structures, loading: cacheLoading, refresh } = useAcademicContext();

  const fetchTeachers = async () => {
    try {
      const teachables = await getAllTeachables();
      setTeachers(teachables as UserProfileWithId[]);
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTeachers(), refresh()]);
    setRefreshing(false);
  }, [refresh]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.mobile.toLowerCase().includes(q)
      );
    });
  }, [teachers, searchQuery]);

  // Precompute slots to avoid calculating them inside renderItem
  const teachersWithSlots = useMemo(() => {
    return filteredTeachers.map((item) => ({
      item,
      teachingSlots: getTeachingSlotsForUser(item.id, structures),
    }));
  }, [filteredTeachers, structures]);

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
      <AppHeader title="Teachers 👨‍🏫" showLogout={false} />

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
        data={teachersWithSlots}
        keyExtractor={({ item }) => item.id}
        style={{ marginTop: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item: { item, teachingSlots } }) => (
          <TeacherCard
            item={item}
            teachingSlots={teachingSlots}
            onPress={() =>
              router.push({
                pathname: "/(owner)/manage-teacher" as never,
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


