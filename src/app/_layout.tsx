import { Stack } from "expo-router";

import "../global.css";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="loading" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(owner)" />
      <Stack.Screen name="(teacher)" />
      <Stack.Screen name="(student)" />
    </Stack>
  );
}
