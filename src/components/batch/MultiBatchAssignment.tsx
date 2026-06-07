import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";
import {
  dedupeAssignedSubjects,
  formatSubjectSlotLabel,
  getSubjectSlotKey,
} from "../../services/batchUtils";
import { findAcademicStructure } from "../../services/academicGrouping";
import { toStudentSlot, toTeachingSlot } from "../../services/subjectSlotSync";
import type { AcademicStructure } from "../../types/academic";
import type { AssignedSubject } from "../../types/user";
import AuthButton from "../AuthButton";
import EmptyState from "./EmptyState";

type Props = {
  structures: AcademicStructure[];
  value: AssignedSubject[];
  onChange: (slots: AssignedSubject[]) => void;
  /** Students get teacherId/teacherName; teachers/owners get slot only. */
  assignmentRole?: "student" | "teacher";
};

export default function MultiBatchAssignment({
  structures,
  value,
  onChange,
  assignmentRole = "student",
}: Props) {
  const [pickerValue, setPickerValue] = useState("");

  const structureOptions = useMemo(
    () =>
      structures.map((s) => ({
        key: s.id,
        value: getSubjectSlotKey({
          classLevel: s.classLevel,
          batch: s.batch,
          subject: s.subject,
        }),
        label: `Class ${s.classLevel} · ${s.batch} · ${s.subject}`,
        structure: s,
      })),
    [structures]
  );

  const selectedStructure = useMemo(() => {
    if (!pickerValue) {
      return undefined;
    }

    const [classLevel, batch, subject] = pickerValue.split("::");
    return findAcademicStructure(structures, classLevel, batch, subject);
  }, [pickerValue, structures]);

  const handleAddAssignment = () => {
    if (!selectedStructure) {
      Alert.alert("Error", "Select a subject slot from academic structure");
      return;
    }

    const slot =
      assignmentRole === "student"
        ? toStudentSlot(
            {
              classLevel: selectedStructure.classLevel,
              batch: selectedStructure.batch,
              subject: selectedStructure.subject,
            },
            selectedStructure
          )
        : toTeachingSlot({
            classLevel: selectedStructure.classLevel,
            batch: selectedStructure.batch,
            subject: selectedStructure.subject,
          });

    const next = dedupeAssignedSubjects([...value, slot]);

    onChange(next);
    setPickerValue("");
  };

  const handleRemove = (batch: AssignedSubject) => {
    onChange(
      value.filter((item) => getSubjectSlotKey(item) !== getSubjectSlotKey(batch))
    );
  };

  return (
    <View>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          marginBottom: SPACING.sm,
          color: COLORS.text,
        }}
      >
        Assigned Subject Slots
      </Text>

      {value.length === 0 ? (
        <EmptyState message="No subject slots assigned yet. Add one below." />
      ) : (
        value.map((batch) => (
          <View
            key={getSubjectSlotKey(batch)}
            style={{
              backgroundColor: COLORS.card,
              padding: SPACING.md,
              borderRadius: 12,
              marginBottom: SPACING.sm,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ flex: 1, color: COLORS.text, fontSize: 15 }}>
              {formatSubjectSlotLabel(batch)}
            </Text>
            <TouchableOpacity onPress={() => handleRemove(batch)}>
              <Text style={{ color: "#c00", fontWeight: "600" }}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          marginTop: SPACING.md,
          marginBottom: SPACING.sm,
          color: COLORS.text,
        }}
      >
        Add Subject Slot
      </Text>

      {structures.length === 0 ? (
        <EmptyState message="Create academic structures first in Manage Batches." />
      ) : (
        <>
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 10,
              marginBottom: SPACING.sm,
            }}
          >
            <Picker
              selectedValue={pickerValue}
              onValueChange={(val) => {
                setPickerValue(val);
              }}
            >
              <Picker.Item label="Select class + batch + subject" value="" />
              {structureOptions.map((option) => (
                <Picker.Item
                  key={option.key}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>

          {selectedStructure ? (
            <Text style={{ color: COLORS.gray, marginBottom: SPACING.sm }}>
              Selected: {selectedStructure.batch} · {selectedStructure.subject}
              {selectedStructure.assignedTeacherName
                ? ` · ${selectedStructure.assignedTeacherName}`
                : ""}
            </Text>
          ) : null}

          <AuthButton title="Add Subject Slot" onPress={handleAddAssignment} />
        </>
      )}
    </View>
  );
}
