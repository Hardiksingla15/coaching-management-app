import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import ScreenContainer from "../../components/ScreenContainer";
import ContextHeader from "../../components/batch/ContextHeader";
import EmptyState from "../../components/batch/EmptyState";
import { useBatchContext } from "../../context/BatchContext";
import {
  getAnnouncementsForSlot,
  type AnnouncementRecord,
} from "../../firebase/announcements";

export default function NotificationsScreen() {
  const { activeBatch } = useBatchContext();
  const [items, setItems] = useState<AnnouncementRecord[]>([]);

  useEffect(() => {
    if (!activeBatch) {
      setItems([]);
      return;
    }
    getAnnouncementsForSlot(activeBatch)
      .then(setItems)
      .catch(() => setItems([]));
  }, [activeBatch]);

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 12 }}>
        Announcements
      </Text>
      <ContextHeader activeBatch={activeBatch} />
      {!activeBatch ? (
        <EmptyState message="Select a subject slot on the dashboard first." />
      ) : items.length === 0 ? (
        <EmptyState message="No announcements for this slot." />
      ) : (
        items.map((item) => (
        <View
          key={item.id}
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
          <Text style={{ marginTop: 6, color: "gray" }}>
            Target: {item.targetType}
          </Text>
        </View>
        ))
      )}
    </ScreenContainer>
  );
}
