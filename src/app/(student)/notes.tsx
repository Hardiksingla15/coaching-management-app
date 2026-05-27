import { Text, View } from "react-native";
import { useCallback } from "react";

import BatchFilteredListScreen from "../../components/batch/BatchFilteredListScreen";
import { getNotes } from "../../firebase/notes";

export default function NotesScreen() {
  const fetchNotes = useCallback(() => getNotes(), []);

  return (
    <BatchFilteredListScreen
      title="Notes 📚"
      emptyMessage="No notes for this batch yet."
      fetchItems={fetchNotes}
      renderItem={(item: any) => (
        <View
          style={{
            backgroundColor: "#f5f5f5",
            padding: 15,
            borderRadius: 10,
            marginBottom: 15,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.title}</Text>
          <Text style={{ marginTop: 5, color: "gray" }}>{item.description}</Text>
          {item.subject ? (
            <Text style={{ marginTop: 8 }}>Subject: {item.subject}</Text>
          ) : null}
        </View>
      )}
    />
  );
}
