import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useRouter } from "expo-router";

import MultiBatchAssignment from "../batch/MultiBatchAssignment";
import AuthButton from "../AuthButton";
import CustomInput from "../CustomInput";
import ScreenContainer from "../ScreenContainer";
import { createInstituteAuthAccount } from "../../firebase/instituteAuth";
import {
  deleteUserProfile,
  getUserData,
  saveUserData,
  updateUserData,
} from "../../firebase/firestore";
import { getAcademicStructures } from "../../firebase/academic";
import type { AcademicStructure } from "../../types/academic";
import type { AssignedBatch, UserRole } from "../../types/user";
import { STUDENT_INSTITUTION_CODE } from "../../constants/appConstants";

type Props = {
  userId?: string;
  role: Extract<UserRole, "student" | "teacher">;
};

export default function ManageUserForm({ userId, role }: Props) {
  const router = useRouter();
  const isEdit = Boolean(userId);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [assignedBatches, setAssignedBatches] = useState<AssignedBatch[]>([]);
  const [structures, setStructures] = useState<AcademicStructure[]>([]);
  const [loading, setLoading] = useState(false);

  const roleLabel = role === "student" ? "Student" : "Teacher";

  useEffect(() => {
    getAcademicStructures()
      .then(setStructures)
      .catch(() => {
        Alert.alert("Error", "Failed to load academic structures");
      });
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    getUserData(userId)
      .then((data) => {
        if (!data) {
          return;
        }

        setName(data.name);
        setMobile(data.mobile);
        setAssignedBatches(data.assignedBatches ?? []);
      })
      .catch(() => {
        Alert.alert("Error", `Failed to load ${roleLabel.toLowerCase()}`);
      });
  }, [userId, roleLabel]);

  const handleSave = async () => {
    if (!name.trim() || !mobile.trim()) {
      Alert.alert("Error", "Name and mobile are required");
      return;
    }

    if (!isEdit && password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (assignedBatches.length === 0) {
      Alert.alert("Error", "Assign at least one batch");
      return;
    }

    try {
      setLoading(true);

      if (isEdit && userId) {
        await updateUserData(userId, {
          name: name.trim(),
          mobile: mobile.trim(),
          assignedBatches,
        });

        Alert.alert("Success", `${roleLabel} updated`);
        router.back();
        return;
      }

      const credential = await createInstituteAuthAccount(
        mobile.trim(),
        password
      );

      await saveUserData(credential.user.uid, {
        name: name.trim(),
        mobile: mobile.trim(),
        role,
        institutionCode:
          role === "student" ? STUDENT_INSTITUTION_CODE : null,
        assignedBatches,
        createdAt: Date.now(),
      });

      Alert.alert("Success", `${roleLabel} created`);
      router.back();
    } catch (error: unknown) {
      let message = "Save failed";

      if (error instanceof Error) {
        if (error.message.includes("auth/email-already-in-use")) {
          message = "Mobile number already registered";
        }
      }

      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!userId) {
      return;
    }

    Alert.alert(
      `Delete ${roleLabel}`,
      "This removes the user profile from the institute. Auth account may still exist.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUserProfile(userId);
              Alert.alert("Deleted", `${roleLabel} profile removed`);
              router.back();
            } catch {
              Alert.alert("Error", "Delete failed");
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 20,
        }}
      >
        {isEdit ? `Edit ${roleLabel}` : `Create ${roleLabel}`}
      </Text>

      <CustomInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      {isEdit ? (
        <Text
          style={{
            marginBottom: 20,
            padding: 15,
            backgroundColor: "#f5f5f5",
            borderRadius: 10,
          }}
        >
          Mobile: {mobile}
        </Text>
      ) : (
        <CustomInput
          placeholder="Mobile Number"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
        />
      )}

      {!isEdit && (
        <CustomInput
          placeholder="Password (min 6 chars)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      )}

      <View style={{ marginTop: 10 }}>
        <MultiBatchAssignment
          structures={structures}
          value={assignedBatches}
          onChange={setAssignedBatches}
        />
      </View>

      <AuthButton
        title={loading ? "Saving..." : isEdit ? "Save Changes" : `Create ${roleLabel}`}
        onPress={handleSave}
      />

      {isEdit && (
        <AuthButton title={`Delete ${roleLabel}`} onPress={handleDelete} />
      )}
    </ScreenContainer>
  );
}
