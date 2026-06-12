import { useEffect, useState } from "react";
import { Alert, Text, View, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
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
import { updateAcademicStructure } from "../../firebase/academic";
import { useAcademicContext } from "../../context/AcademicContext";
import {
  syncAllTeachableSlotsFromStructure,
  syncStudentTeacherFieldsFromStructure,
} from "../../firebase/subjectSlotSync";
import type { AcademicStructure } from "../../types/academic";
import type { AssignedSubject, UserRole } from "../../types/user";
import { STUDENT_INSTITUTION_CODE } from "../../constants/appConstants";
import { sanitizeAssignedSubjectsForRole } from "../../services/subjectSlotSync";
import { getSubjectSlotKey } from "../../services/batchUtils";
import { getStudentFees, assignFeeRecord, deleteFeeRecord } from "../../firebase/fees";


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
  const [assignedSubjects, setAssignedSubjects] = useState<AssignedSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const { structures, loading: cacheLoading } = useAcademicContext();
  const [originalSubjects, setOriginalSubjects] = useState<AssignedSubject[]>([]);
  const [fees, setFees] = useState<Record<string, number>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const roleLabel = role === "student" ? "Student" : "Teacher";

  useEffect(() => {
    if (!userId) {
      return;
    }

    setLoadingData(true);

    const fetchUserData = getUserData(userId);
    const fetchFeesData = role === "student" ? getStudentFees(userId) : Promise.resolve([]);

    Promise.all([fetchUserData, fetchFeesData])
      .then(([userData, feeRecords]) => {
        if (!userData) {
          return;
        }

        setName(userData.name);
        setMobile(userData.mobile);
        const subjects = userData.assignedSubjects ?? [];
        setAssignedSubjects([...subjects]);
        setOriginalSubjects([...subjects]);

        if (role === "student" && feeRecords) {
          const feeMap: Record<string, number> = {};
          feeRecords.forEach((rec) => {
            feeMap[getSubjectSlotKey(rec)] = rec.totalFee;
          });
          setFees(feeMap);
        }
      })
      .catch(() => {
        Alert.alert("Error", `Failed to load ${roleLabel.toLowerCase()}`);
      })
      .finally(() => {
        setLoadingData(false);
      });
  }, [userId, role, roleLabel]);

  const handleNameChange = (val: string) => {
    setName(val);
    setSaveSuccess(false);
  };

  const handleMobileChange = (val: string) => {
    setMobile(val);
    setSaveSuccess(false);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    setSaveSuccess(false);
  };

  const handleAssignedSubjectsChange = (val: AssignedSubject[]) => {
    setAssignedSubjects(val);
    setSaveSuccess(false);
  };

  const handleFeeChange = (slotKey: string, fee: number) => {
    setFees((prev) => ({
      ...prev,
      [slotKey]: fee,
    }));
    setSaveSuccess(false);
  };

  const syncAcademicStructureForTeacher = async (
    teacherId: string,
    teacherName: string,
    oldSlots: AssignedSubject[],
    newSlots: AssignedSubject[],
    structuresList: AcademicStructure[]
  ) => {
    const getNormalizedKey = (slot: AssignedSubject) => {
      const cls = String(slot.classLevel ?? "").trim().toLowerCase();
      const bch = String(slot.batch ?? "").trim().toLowerCase();
      const sbj = String(slot.subject ?? "").trim().toLowerCase();
      return `${cls}::${bch}::${sbj}`;
    };

    const oldKeys = new Set(oldSlots.map(getNormalizedKey));
    const newKeys = new Set(newSlots.map(getNormalizedKey));

    const removed = oldSlots.filter((s) => !newKeys.has(getNormalizedKey(s)));
    const added = newSlots.filter((s) => !oldKeys.has(getNormalizedKey(s)));

    for (const slot of removed) {
      const struct = structuresList.find(
        (s) =>
          String(s.classLevel ?? "").trim().toLowerCase() === String(slot.classLevel ?? "").trim().toLowerCase() &&
          String(s.batch ?? "").trim().toLowerCase() === String(slot.batch ?? "").trim().toLowerCase() &&
          String(s.subject ?? "").trim().toLowerCase() === String(slot.subject ?? "").trim().toLowerCase()
      );
      if (struct) {
        await updateAcademicStructure(struct.id, {
          assignedTeacherId: "",
          assignedTeacherName: "",
        });
      }
    }

    for (const slot of added) {
      const struct = structuresList.find(
        (s) =>
          String(s.classLevel ?? "").trim().toLowerCase() === String(slot.classLevel ?? "").trim().toLowerCase() &&
          String(s.batch ?? "").trim().toLowerCase() === String(slot.batch ?? "").trim().toLowerCase() &&
          String(s.subject ?? "").trim().toLowerCase() === String(slot.subject ?? "").trim().toLowerCase()
      );
      if (struct) {
        await updateAcademicStructure(struct.id, {
          assignedTeacherId: teacherId,
          assignedTeacherName: teacherName,
        });
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !mobile.trim()) {
      Alert.alert("Error", "Name and mobile are required");
      return;
    }

    if (!isEdit && password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      setSaveSuccess(false);

      if (isEdit && userId) {
        const cleaned = sanitizeAssignedSubjectsForRole(
          role,
          assignedSubjects,
          structures
        );

        if (role === "teacher") {
          await syncAcademicStructureForTeacher(
            userId,
            name.trim(),
            originalSubjects,
            cleaned,
            structures
          );
        }

        if (role === "student") {
          const newKeys = new Set(cleaned.map(getSubjectSlotKey));
          const removed = originalSubjects.filter((s) => !newKeys.has(getSubjectSlotKey(s)));
          
          for (const slot of removed) {
            await deleteFeeRecord(userId, slot);
          }
          for (const slot of cleaned) {
            const feeVal = fees[getSubjectSlotKey(slot)] ?? 0;
            await assignFeeRecord(userId, name.trim(), slot, feeVal);
          }
        }

        await updateUserData(userId, {
          name: name.trim(),
          mobile: mobile.trim(),
          assignedSubjects: cleaned,
        });

        if (role === "student") {
          await syncStudentTeacherFieldsFromStructure();
        } else {
          await syncAllTeachableSlotsFromStructure();
          await syncStudentTeacherFieldsFromStructure();
        }

        setOriginalSubjects([...cleaned]);
        setSaveSuccess(true);
        Alert.alert("Success", `${roleLabel} updated successfully`);
        return;
      }

      const credential = await createInstituteAuthAccount(
        mobile.trim(),
        password
      );

      const cleaned = sanitizeAssignedSubjectsForRole(
        role,
        assignedSubjects,
        structures
      );

      if (role === "teacher") {
        await syncAcademicStructureForTeacher(
          credential.user.uid,
          name.trim(),
          [],
          cleaned,
          structures
        );
      }

      if (role === "student") {
        for (const slot of cleaned) {
          const feeVal = fees[getSubjectSlotKey(slot)] ?? 0;
          await assignFeeRecord(credential.user.uid, name.trim(), slot, feeVal);
        }
      }

      await saveUserData(credential.user.uid, {
        name: name.trim(),
        mobile: mobile.trim(),
        role,
        institutionCode:
          role === "student" ? STUDENT_INSTITUTION_CODE : null,
        assignedSubjects: cleaned,
        createdAt: Date.now(),
      });

      if (role === "student") {
        await syncStudentTeacherFieldsFromStructure();
      } else {
        await syncAllTeachableSlotsFromStructure();
        await syncStudentTeacherFieldsFromStructure();
      }

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

  if (loadingData || cacheLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            marginBottom: 20,
          }}
        >
          {isEdit ? `Edit ${roleLabel}` : `Create ${roleLabel}`}
        </Text>

        {saveSuccess && (
          <View
            style={{
              backgroundColor: "#e6f7ed",
              borderColor: "#28a745",
              borderWidth: 1,
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontWeight: "700", color: "#1e7e34" }}>Changes Saved</Text>
            <Text style={{ marginTop: 4, color: "#333" }}>
              {roleLabel} details have been updated successfully.
            </Text>
          </View>
        )}

        <CustomInput
          placeholder="Full Name"
          value={name}
          onChangeText={handleNameChange}
        />

        {isEdit ? (
          <Text
            style={{
              marginBottom: 20,
              padding: 15,
              backgroundColor: "#f5f5f5",
              borderRadius: 10,
              color: "#333",
            }}
          >
            Mobile: {mobile}
          </Text>
        ) : (
          <CustomInput
            placeholder="Mobile Number"
            value={mobile}
            onChangeText={handleMobileChange}
            keyboardType="phone-pad"
          />
        )}

        {!isEdit && (
          <CustomInput
            placeholder="Password (min 6 chars)"
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry
          />
        )}

        <View style={{ marginTop: 10 }}>
          <MultiBatchAssignment
            structures={structures}
            value={assignedSubjects}
            onChange={handleAssignedSubjectsChange}
            assignmentRole={role}
            fees={fees}
            onFeeChange={handleFeeChange}
          />
        </View>

        <AuthButton
          title={loading ? "Saving..." : isEdit ? "Save Changes" : `Create ${roleLabel}`}
          onPress={handleSave}
        />

        {isEdit && (
          <AuthButton title={`Delete ${roleLabel}`} onPress={handleDelete} />
        )}

        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: "#e2e8f0",
            padding: 18,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 10,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "#475569",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            Cancel
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

