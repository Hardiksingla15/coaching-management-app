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
import { getAllTeachers } from "../../firebase/firestore";
import type { UserProfileWithId } from "../../types/user";

export default function OwnerTeachersScreen() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<UserProfileWithId[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeachers = async () => {
    try {
      const data = await getAllTeachers();
      setTeachers(data as UserProfileWithId[]);
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
        Teachers 👨‍🏫
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
        renderItem={({ item }) => (
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
            <Text style={{ marginTop: 10, fontWeight: "600" }}>Teaching batches:</Text>
            {item.assignedBatches?.length ? (
              item.assignedBatches.map((batch) => (
                <Text key={`${batch.classLevel}-${batch.batch}`}>
                  · {formatBatchShort(batch)}
                  {batch.subjects?.length
                    ? ` (${batch.subjects.join(", ")})`
                    : ""}
                </Text>
              ))
            ) : (
              <Text style={{ color: "gray" }}>Not assigned</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}
