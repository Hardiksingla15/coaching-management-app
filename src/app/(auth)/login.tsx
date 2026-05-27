import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, Alert } from "react-native";

import AuthHeader from "../../components/AuthHeader";
import ScreenContainer from "../../components/ScreenContainer";
import CustomInput from "../../components/CustomInput";
import AuthButton from "../../components/AuthButton";
import { loginUser } from "../../firebase/auth";
import { getUserByMobile } from "../../firebase/firestore";
import { getDashboardPath } from "../../services/roleRouting";

export default function LoginScreen() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!mobile || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const userData = await getUserByMobile(mobile);

      if (!userData) {
        Alert.alert("Error", "Account not found");
        return;
      }

      await loginUser(mobile, password);

      const roleLabel =
        userData.role === "owner"
          ? "Owner"
          : userData.role === "teacher"
            ? "Teacher"
            : "Student";

      Alert.alert("Success", `${roleLabel} login successful`);

      router.replace(getDashboardPath(userData.role) as never);
    } catch (error: unknown) {
      let errorMessage = "Something went wrong";

      if (
        error instanceof Error &&
        error.message.includes("auth/invalid-credential")
      ) {
        errorMessage = "Wrong mobile or password";
      }

      Alert.alert("Login Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <AuthHeader title="Welcome Back 👋" subtitle="Login to continue" />

      <CustomInput
        placeholder="Mobile Number"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
      />

      <CustomInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <AuthButton
        title={loading ? "Logging in..." : "Login"}
        onPress={handleLogin}
      />

      <Link href="/(auth)/signup" asChild>
        <TouchableOpacity
          style={{
            marginTop: 20,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "blue",
              fontSize: 16,
            }}
          >
            Create New Account
          </Text>
        </TouchableOpacity>
      </Link>
    </ScreenContainer>
  );
}
