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
  dedupeBatches,
  formatBatchLabel,
  getBatchKey,
} from "../../services/batchUtils";
import { findAcademicStructure } from "../../services/academicGrouping";
import type { AcademicStructure } from "../../types/academic";
import type { AssignedBatch } from "../../types/user";
import AuthButton from "../AuthButton";
import EmptyState from "./EmptyState";

type Props = {
  structures: AcademicStructure[];
  value: AssignedBatch[];
  onChange: (batches: AssignedBatch[]) => void;
};

export default function MultiBatchAssignment({
  structures,
  value,
  onChange,
}: Props) {
  const [pickerValue, setPickerValue] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const structureOptions = useMemo(
    () =>
      structures.map((s) => ({
        key: s.id,
        value: getBatchKey({
          classLevel: s.classLevel,
          batch: s.batch,
          subjects: [],
        }),
        label: `Class ${s.classLevel} · ${s.batch}`,
        structure: s,
      })),
    [structures]
  );

  const selectedStructure = useMemo(() => {
    if (!pickerValue) {
      return undefined;
    }

    const [classLevel, batch] = pickerValue.split("::");
    return findAcademicStructure(structures, classLevel, batch);
  }, [pickerValue, structures]);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleAddAssignment = () => {
    if (!selectedStructure) {
      Alert.alert("Error", "Select a batch from academic structure");
      return;
    }

    if (selectedSubjects.length === 0) {
      Alert.alert("Error", "Select at least one subject");
      return;
    }

    const next = dedupeBatches([
      ...value,
      {
        classLevel: selectedStructure.classLevel,
        batch: selectedStructure.batch,
        subjects: selectedSubjects,
      },
    ]);

    onChange(next);
    setPickerValue("");
    setSelectedSubjects([]);
  };

  const handleRemove = (batch: AssignedBatch) => {
    onChange(
      value.filter((item) => getBatchKey(item) !== getBatchKey(batch))
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
        Assigned Batches
      </Text>

      {value.length === 0 ? (
        <EmptyState message="No batches assigned yet. Add one below." />
      ) : (
        value.map((batch) => (
          <View
            key={getBatchKey(batch)}
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
              {formatBatchLabel(batch)}
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
        Add Batch Assignment
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
                setSelectedSubjects([]);
              }}
            >
              <Picker.Item label="Select class & batch" value="" />
              {structureOptions.map((option) => (
                <Picker.Item
                  key={option.key}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>

          {selectedStructure && (
            <View style={{ marginBottom: SPACING.sm }}>
              <Text
                style={{
                  marginBottom: SPACING.xs,
                  color: COLORS.gray,
                  fontSize: 14,
                }}
              >
                Select subjects (multi-select)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedStructure.subjects.map((subject) => {
                  const active = selectedSubjects.includes(subject);
                  return (
                    <TouchableOpacity
                      key={subject}
                      onPress={() => toggleSubject(subject)}
                      style={{
                        backgroundColor: active
                          ? COLORS.primary
                          : COLORS.card,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 20,
                        marginRight: SPACING.sm,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Text
                        style={{
                          color: active ? "#fff" : COLORS.text,
                          fontWeight: "600",
                        }}
                      >
                        {subject}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <AuthButton title="Add Batch" onPress={handleAddAssignment} />
        </>
      )}
    </View>
  );
}
