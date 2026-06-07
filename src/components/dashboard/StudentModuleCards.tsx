import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useBatchContext } from "../../context/BatchContext";
import DashboardCard from "../DashboardCard";
import DashboardSection from "../batch/DashboardSection";
import EmptyState from "../batch/EmptyState";

export default function StudentModuleCards() {
  const router = useRouter();
  const { activeBatch } = useBatchContext();

  const go = (path: string) => {
    if (!activeBatch) {
      Alert.alert("Select a slot", "Choose your subject slot to view this section.");
      return;
    }

    router.push(path as never);
  };

  if (!activeBatch) {
    return (
      <DashboardSection title="Modules">
        <EmptyState message="Select a subject slot above to unlock notes, attendance, fees, and more." />
      </DashboardSection>
    );
  }

  return (
    <>
      <DashboardSection title="Resources">
        <DashboardCard
          title="Notes"
          icon="document-text"
          onPress={() => go("/(student)/notes")}
        />
        <DashboardCard
          title="Attendance"
          icon="calendar"
          onPress={() => go("/(student)/attendance")}
        />
        <DashboardCard
          title="Fees"
          icon="cash"
          onPress={() => go("/(student)/fees")}
        />
      </DashboardSection>

      <DashboardSection title="Updates">
        <DashboardCard
          title="Announcements"
          icon="notifications"
          onPress={() => go("/(student)/notifications")}
        />
        <DashboardCard
          title="Doubts"
          icon="help-circle"
          onPress={() => go("/(student)/doubts")}
        />
      </DashboardSection>
    </>
  );
}
