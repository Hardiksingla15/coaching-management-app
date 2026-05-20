import ScreenContainer from "../../components/ScreenContainer";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import AppHeader from "../../components/AppHeader";
import DashboardCard from "../../components/DashboardCard";

export default function StudentDashboard() {

  const router = useRouter();

  return (
    <ScreenContainer>
      <AppHeader title="Student Dashboard 🎓" />

      <DashboardCard
        title="Notes"
        icon="document-text"
        onPress={() => router.push("/(student)/notes")}
      />

      <DashboardCard
        title="Notifications"
        icon="notifications"
        onPress={() => router.push("/(student)/notifications")}
      />

      <DashboardCard
        title="Doubts"
        icon="help-circle"
        onPress={() => router.push("/(student)/doubts")}
      />

      <DashboardCard
        title="Fees"
        icon="cash"
        onPress={() => router.push("/(student)/fees")}
      />
    </ScreenContainer>
  );
}