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


export default function LoginScreen() {

  const router = useRouter();

 
  const [mobile, setMobile] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async () => {

    if (
      
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
        Alert.alert(
          "Success",
          "Student Login Successful 🚀"
        );
      
        router.push(
          "/(student)/dashboard"
        );
      
      } else {
      
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