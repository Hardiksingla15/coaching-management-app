import ScreenContainer from "../../components/ScreenContainer";
import ContextHeader from "../../components/batch/ContextHeader";
import EmptyState from "../../components/batch/EmptyState";
import { useBatchContext } from "../../context/BatchContext";
import { Text } from "react-native";

export default function FeesScreen() {
  const { activeBatch } = useBatchContext();

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 12 }}>
        Fees
      </Text>
      <ContextHeader activeBatch={activeBatch} />
      <EmptyState message="Fee details for the active batch will appear in the next phase." />
    </ScreenContainer>
  );
}
