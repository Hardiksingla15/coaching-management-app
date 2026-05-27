import { useRouter } from "expo-router";

import DashboardCard from "../DashboardCard";

type Props = {
  /** Expo route group for teaching screens (owner reuses teacher routes). */
  routeGroup?: "/(teacher)";
};

export default function TeacherQuickActions({
  routeGroup = "/(teacher)",
}: Props) {
  const router = useRouter();

  return (
    <>
      <DashboardCard
        title="Mark Attendance"
        icon="calendar"
        onPress={() => router.push(`${routeGroup}/attendance` as never)}
      />

      <DashboardCard
        title="Upload Notes"
        icon="cloud-upload"
        onPress={() => router.push(`${routeGroup}/uploads` as never)}
      />

      <DashboardCard
        title="Announcements"
        icon="megaphone"
        onPress={() => router.push(`${routeGroup}/announcements` as never)}
      />

      <DashboardCard
        title="Doubts"
        icon="chatbubble-ellipses"
        onPress={() => router.push(`${routeGroup}/doubts` as never)}
      />
    </>
  );
}
