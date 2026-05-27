import ScreenContainer from "../../components/ScreenContainer";
import ContextHeader from "../../components/batch/ContextHeader";
import EmptyState from "../../components/batch/EmptyState";
import { useBatchContext } from "../../context/BatchContext";
import { Text } from "react-native";

export default function DoubtsScreen() {
  const { activeBatch } = useBatchContext();

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 12 }}>
        Doubts
      </Text>
      <ContextHeader activeBatch={activeBatch} />
      <EmptyState message="Ask and view doubts for the active batch in the next phase." />
    </ScreenContainer>
  );
}
