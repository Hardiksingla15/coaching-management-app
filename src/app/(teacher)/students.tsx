import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "expo-router";

import ScreenContainer
from "../../components/ScreenContainer";

import {
  getAllStudents,
} from "../../firebase/firestore";

export default function StudentsScreen() {

  const router =
    useRouter();

  const [students,
    setStudents] =
    useState<any[]>([]);

  const [loading,
    setLoading] =
    useState(true);

  const fetchStudents =
    async () => {

      try {

        const data =
          await getAllStudents();

        setStudents(data);

      } catch {

        console.log(
          "Failed to fetch students"
        );

      } finally {

        setLoading(false);
      }
    };

  useEffect(() => {

    fetchStudents();

  }, []);

  if (loading) {

    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator
          size="large"
        />
      </View>
    );
  }

  return (
    <ScreenContainer>

      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 20,
        }}
      >
        Students 👨‍🎓
      </Text>

      <FlatList
        data={students}

        keyExtractor={(item) =>
          item.id
        }

        renderItem={({ item }) => (

          <TouchableOpacity

            onPress={() =>

              router.push({

                pathname:
                  "/(teacher)/manage-student",

                params: {
                  id: item.id,
                },
              })
            }

            style={{
              backgroundColor: "#f5f5f5",

              padding: 15,

              borderRadius: 10,

              marginBottom: 15,
            }}
          >

            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              {item.name}
            </Text>

            <Text
              style={{
                marginTop: 5,
                color: "gray",
              }}
            >
              {item.mobile}
            </Text>

            <Text
              style={{
                marginTop: 10,
              }}
            >
              Class:
              {" "}
              {item.classLevel ||
                "Not Assigned"}
            </Text>

            <Text>
              Batch:
              {" "}
              {item.batch ||
                "Not Assigned"}
            </Text>

          </TouchableOpacity>
        )}
      />

    </ScreenContainer>
  );
}