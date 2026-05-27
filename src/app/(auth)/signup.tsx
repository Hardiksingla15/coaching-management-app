import { useState } from "react";
import { Link, useRouter } from "expo-router";

import {
  Text,
  TouchableOpacity,
  Alert,
  View,
} from "react-native";

import ScreenContainer from "../../components/ScreenContainer";
import AuthHeader from "../../components/AuthHeader";
import CustomInput from "../../components/CustomInput";
import AuthButton from "../../components/AuthButton";

import { signupUser } from "../../firebase/auth";

import { saveUserData } from "../../firebase/firestore";
import { getDashboardPath } from "../../services/roleRouting";
import type { UserRole } from "../../types/user";

import {
  STUDENT_INSTITUTION_CODE,
  TEACHER_ACCESS_CODE,
} from "../../constants/appConstants";

export default function SignupScreen() {

  const router = useRouter();

  const [name, setName] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [role, setRole] =
    useState("student");

  const [institutionCode,
    setInstitutionCode] =
    useState("");

  const [teacherCode,
    setTeacherCode] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSignup = async () => {

    if (
      !name ||
      !mobile ||
      !password
    ) {

      Alert.alert(
        "Error",
        "Please fill all fields"
      );

      return;
    }

    if (mobile.length < 10) {

      Alert.alert(
        "Error",
        "Enter valid mobile number"
      );

      return;
    }

    if (password.length < 6) {

      Alert.alert(
        "Error",
        "Password must be at least 6 characters"
      );

      return;
    }

    // STUDENT VALIDATION
    if (role === "student") {

      if (
        accessCodeCheck(
          institutionCode,
          STUDENT_INSTITUTION_CODE
        ) === false
      ) {

        Alert.alert(
          "Error",
          "Invalid institution code"
        );

        return;
      }
    }

    // TEACHER VALIDATION
    if (role === "teacher") {

      if (
        accessCodeCheck(
          teacherCode,
          TEACHER_ACCESS_CODE
        ) === false
      ) {

        Alert.alert(
          "Error",
          "Invalid teacher access code"
        );

        return;
      }
    }

    try {

      setLoading(true);

      const userCredential =
        await signupUser(
          mobile,
          password
        );

      const uid =
        userCredential.user.uid;

        await saveUserData(uid, {
          name,
          mobile,
          role: role as UserRole,
          institutionCode:
            role === "student" ? institutionCode : null,
          assignedBatches: [],
          createdAt: Date.now(),
        });
        
      Alert.alert(
        "Success",
        "Account Created 🚀"
      );

      router.replace(getDashboardPath(role) as never);

    } catch (error: any) {

      let errorMessage =
        "Signup failed";

      if (
        error.message.includes(
          "auth/email-already-in-use"
        )
      ) {

        errorMessage =
          "Account already exists";
      }

      Alert.alert(
        "Signup Error",
        errorMessage
      );

    } finally {

      setLoading(false);
    }
  };

  const accessCodeCheck = (
    entered: string,
    actual: string
  ) => {

    return entered === actual;
  };

  return (
    <ScreenContainer>

      <AuthHeader
        title="Create Account 🚀"
        subtitle="Start your learning journey"
      />

      <CustomInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
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

      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 10,
          marginTop: 10,
        }}
      >
        Select Role
      </Text>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
          marginBottom: 20,
        }}
      >

        <TouchableOpacity
          onPress={() =>
            setRole("student")
          }

          style={{
            flex: 1,

            backgroundColor:
              role === "student"
                ? "black"
                : "#ddd",

            padding: 15,

            borderRadius: 10,

            alignItems: "center",
          }}
        >

          <Text
            style={{
              color:
                role === "student"
                  ? "white"
                  : "black",

              fontWeight: "bold",
            }}
          >
            Student
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            setRole("teacher")
          }

          style={{
            flex: 1,

            backgroundColor:
              role === "teacher"
                ? "black"
                : "#ddd",

            padding: 15,

            borderRadius: 10,

            alignItems: "center",
          }}
        >

          <Text
            style={{
              color:
                role === "teacher"
                  ? "white"
                  : "black",

              fontWeight: "bold",
            }}
          >
            Teacher
          </Text>

        </TouchableOpacity>

      </View>

      {role === "student" && (

        <CustomInput
          placeholder="Institution Code"
          value={institutionCode}
          onChangeText={
            setInstitutionCode
          }
        />
      )}

      {role === "teacher" && (

        <CustomInput
          placeholder="Teacher Access Code"
          value={teacherCode}
          onChangeText={
            setTeacherCode
          }
        />
      )}

      <AuthButton
        title={
          loading
            ? "Creating Account..."
            : "Create Account"
        }

        onPress={handleSignup}
      />

      <Link href="/(auth)/login" asChild>

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
            Already have an account?
          </Text>

        </TouchableOpacity>

      </Link>

    </ScreenContainer>
  );
}