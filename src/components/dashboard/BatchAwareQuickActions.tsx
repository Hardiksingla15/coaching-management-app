import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useBatchContext } from "../../context/BatchContext";
import DashboardCard from "../DashboardCard";

type Props = {
  routeGroup?: "/(teacher)";
  labels?: {
    attendance?: string;
    notes?: string;
    announcements?: string;
    doubts?: string;
  };
};

export default function BatchAwareQuickActions({
  routeGroup = "/(teacher)",
  labels = {},
}: Props) {
  const router = useRouter();
  const { activeBatch } = useBatchContext();

  const go = (path: string) => {
    if (!activeBatch) {
      Alert.alert(
        "Select a subject slot",
        "Choose a teaching slot first to continue."
      );
      return;
    }

    router.push(path as never);
  };

  return (
    <>
      <DashboardCard
        title={labels.attendance ?? "Mark Attendance"}
        icon="calendar"
        onPress={() => go(`${routeGroup}/attendance`)}
      />
      <DashboardCard
        title={labels.notes ?? "Upload Notes"}
        icon="cloud-upload"
        onPress={() => go(`${routeGroup}/uploads`)}
      />
      <DashboardCard
        title={labels.announcements ?? "Announcements"}
        icon="megaphone"
        onPress={() => go(`${routeGroup}/announcements`)}
      />
      <DashboardCard
        title={labels.doubts ?? "Doubts"}
        icon="chatbubble-ellipses"
        onPress={() => go(`${routeGroup}/doubts`)}
      />
    </>
  );
}
