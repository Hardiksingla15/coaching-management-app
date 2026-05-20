import { Link, useRouter } from "expo-router";
import { useState } from "react";

import {
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";

import AuthHeader from "../../components/AuthHeader";
import ScreenContainer from "../../components/ScreenContainer";
import CustomInput from "../../components/CustomInput";
import AuthButton from "../../components/AuthButton";

import { loginUser } from "../../firebase/auth";

import { getUserByMobile } from "../../firebase/firestore";

import {
  STUDENT_INSTITUTION_CODE,
  TEACHER_ACCESS_CODE,
} from "../../constants/appConstants";

export default function LoginScreen() {

  const router = useRouter();

  const [accessCode, setAccessCode] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async () => {

    if (
      !accessCode ||
      !mobile ||
      !password
    ) {
      Alert.alert(
        "Error",
        "Please fill all fields"
      );

      return;
    }

    try {

      setLoading(true);

      // CHECK USER EXISTS
      const userData =
        await getUserByMobile(mobile);

      if (!userData) {

        Alert.alert(
          "Error",
          "Account not found"
        );

        return;
      }

      // LOGIN AUTH
      await loginUser(
        mobile,
        password
      );

      // STUDENT LOGIN
      if (userData.role === "student") {

        if (
          accessCode !==
          STUDENT_INSTITUTION_CODE
        ) {

          Alert.alert(
            "Error",
            "Invalid institution code"
          );

          return;
        }

        Alert.alert(
          "Success",
          "Student Login Successful 🚀"
        );

        router.push(
          "/(student)/dashboard"
        );

      }

      // TEACHER LOGIN
      else {

        if (
          accessCode !==
          TEACHER_ACCESS_CODE
        ) {

          Alert.alert(
            "Error",
            "Invalid teacher access code"
          );

          return;
        }

        Alert.alert(
          "Success",
          "Teacher Login Successful 🚀"
        );

        router.push(
          "/(teacher)/dashboard"
        );
      }

    } catch (error: any) {

      let errorMessage =
        "Something went wrong";

      if (
        error.message.includes(
          "auth/invalid-credential"
        )
      ) {

        errorMessage =
          "Wrong mobile or password";
      }

      Alert.alert(
        "Login Error",
        errorMessage
      );

    } finally {

      setLoading(false);
    }
  };

  return (
    <ScreenContainer>

      <AuthHeader
        title="Welcome Back 👋"
        subtitle="Login to continue"
      />

      <CustomInput
        placeholder="Access Code"
        value={accessCode}
        onChangeText={setAccessCode}
      />

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
        title={
          loading
            ? "Logging in..."
            : "Login"
        }
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