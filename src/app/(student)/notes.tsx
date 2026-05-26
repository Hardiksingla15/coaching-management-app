import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from "react-native";

import { useEffect, useState }
  from "react";

import ScreenContainer
  from "../../components/ScreenContainer";

import { getNotes }
  from "../../firebase/notes";

export default function NotesScreen() {

  const [notes, setNotes] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const fetchNotes =
    async () => {

      try {

        const data =
          await getNotes();

        setNotes(data);

      } catch {

        console.log(
          "Failed to fetch notes"
        );

      } finally {

        setLoading(false);
      }
    };

  useEffect(() => {

    fetchNotes();

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
        Notes 📚
      </Text>

      <FlatList
        data={notes}

        keyExtractor={(item) =>
          item.id
        }

        renderItem={({ item }) => (

          <View
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
              {item.title}
            </Text>

            <Text
              style={{
                marginTop: 5,
                color: "gray",
              }}
            >
              {item.description}
            </Text>

            <Text
              style={{
                marginTop: 10,
                fontWeight: "bold",
              }}
            >
              Batch:
              {" "}
              {item.batch}
            </Text>

          </View>
        )}
      />

    </ScreenContainer>
  );
}