import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import BatchContextWrapper from "../../components/batch/BatchContextWrapper";

export default function OwnerLayout() {
  return (
    <BatchContextWrapper>
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
          name="students"
          options={{
            title: "Students",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="school" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="teachers"
          options={{
            title: "Teachers",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="manage-batches"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="manage-student"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="manage-teacher"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="attendance"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="fees"
          options={{ href: null }}
        />
      </Tabs>
    </BatchContextWrapper>
  );
}
