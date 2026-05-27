import { useCallback } from "react";
import { Text, View } from "react-native";

import BatchFilteredListScreen from "../../components/batch/BatchFilteredListScreen";
import { getAnnouncements } from "../../firebase/announcements";

export default function NotificationsScreen() {
  const fetchAnnouncements = useCallback(() => getAnnouncements(), []);

  return (
    <BatchFilteredListScreen
      title="Announcements"
      emptyMessage="No announcements for this batch."
      fetchItems={fetchAnnouncements}
      renderItem={(item: any) => (
        <View
          style={{
            backgroundColor: "#f5f5f5",
            padding: 15,
            borderRadius: 10,
            marginBottom: 15,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            {item.title ?? "Announcement"}
          </Text>
          <Text style={{ marginTop: 6, color: "gray" }}>
            {item.message ?? "—"}
          </Text>
        </View>
      )}
    />
  );
}
