import { Text } from "react-native";

import ScreenContainer from "../../components/ScreenContainer";
import ContextHeader from "../../components/batch/ContextHeader";
import EmptyState from "../../components/batch/EmptyState";
import { useBatchContext } from "../../context/BatchContext";

export default function AnnouncementsScreen() {
  const { activeBatch } = useBatchContext();

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 12 }}>
        Announcements
      </Text>
      <ContextHeader activeBatch={activeBatch} />
      <EmptyState message="Send announcements to the active subject slot in the next phase." />
    </ScreenContainer>
  );
}
