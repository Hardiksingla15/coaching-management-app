import ScreenContainer from "../../components/ScreenContainer";
import ContextHeader from "../../components/batch/ContextHeader";
import EmptyState from "../../components/batch/EmptyState";
import { useBatchContext } from "../../context/BatchContext";
import { Text } from "react-native";

export default function StudentAttendanceScreen() {
  const { activeBatch } = useBatchContext();

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 12 }}>
        Attendance
      </Text>
      <ContextHeader activeBatch={activeBatch} />
      <EmptyState message="Attendance records for the active subject slot will appear in the next phase." />
    </ScreenContainer>
  );
}
