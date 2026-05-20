import AppHeader from "../../components/AppHeader";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";

import DashboardCard from "../../components/DashboardCard";

export default function TeacherDashboard() {

  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
      }}
    >
      <AppHeader title="Teacher Dashboard 👨‍🏫" />

      <DashboardCard
        title="Announcements"
        icon="megaphone"
        onPress={() => router.push("/(teacher)/announcements")}
      />

      <DashboardCard
        title="Students"
        icon="people"
        onPress={() => router.push("/(teacher)/students")}
      />

      <DashboardCard
        title="Upload Notes"
        icon="cloud-upload"
        onPress={() => router.push("/(teacher)/uploads")}
      />

      <DashboardCard
        title="Doubts"
        icon="chatbubble-ellipses"
        onPress={() => router.push("/(teacher)/doubts")}
      />
    </View>
  );
}