import { View, Text, TouchableOpacity, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";

import { app } from "../firebase/config";
import { SPACING } from "../constants/spacing";
import { COLORS } from "../constants/colors";

type Props = {
  title: string;
  showLogout?: boolean;
  showBack?: boolean;
};

export default function AppHeader({ title, showLogout = true, showBack = false }: Props) {
  const router = useRouter();

  const handleLogout = () => {
    const performSignOut = async () => {
      try {
        const auth = getAuth(app);
        await signOut(auth);
        router.replace("/(auth)/login");
      } catch {
        if (Platform.OS === "web") {
          window.alert("Failed to log out.");
        } else {
          Alert.alert("Error", "Failed to log out.");
        }
      }
    };

    if (Platform.OS === "web") {
      const confirm = window.confirm("Are you sure you want to log out?");
      if (confirm) {
        void performSignOut();
      }
    } else {
      Alert.alert("Logout", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            void performSignOut();
          },
        },
      ]);
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING.lg,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 8 }}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginLeft: -4 }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        )}
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: COLORS.text,
            flex: 1,
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {title}
        </Text>
      </View>
      {showLogout && (
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: "#fee2e2",
          }}
        >
          <Ionicons name="log-out-outline" size={22} color="#dc2626" />
        </TouchableOpacity>
      )}
    </View>
  );
}
