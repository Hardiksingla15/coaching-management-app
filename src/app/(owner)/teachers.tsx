import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";

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

      <FlatList
        data={teachers}
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
