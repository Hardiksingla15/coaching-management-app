import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TeacherLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "black",
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="announcements"
        options={{
          title: "Announcements",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="students"
        options={{
          title: "Students",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="uploads"
        options={{
          title: "Uploads",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cloud-upload" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="doubts"
        options={{
          title: "Doubts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}