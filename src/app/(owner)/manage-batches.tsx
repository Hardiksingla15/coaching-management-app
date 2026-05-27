import { View, Text, Alert, SectionList } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import ScreenContainer from "../../components/ScreenContainer";
import CustomInput from "../../components/CustomInput";
import AuthButton from "../../components/AuthButton";
import {
  addAcademicStructure,
  getAcademicStructures,
} from "../../firebase/academic";
import { groupAcademicByClass } from "../../services/academicGrouping";
import type { AcademicStructure } from "../../types/academic";

export default function ManageBatches() {
  const [classLevel, setClassLevel] = useState("");
  const [batch, setBatch] = useState("");
  const [subjects, setSubjects] = useState("");
  const [structures, setStructures] = useState<AcademicStructure[]>([]);

  const fetchStructures = async () => {
    const data = await getAcademicStructures();
    setStructures(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchStructures();
    }, [])
  );

  const handleAdd = async () => {
    if (!classLevel || !batch || !subjects) {
      Alert.alert("Error", "Fill all fields");
      return;
    }

    try {
      await addAcademicStructure({
        classLevel,
        batch,
        subjects: subjects.split(",").map((s) => s.trim()),
      });

      Alert.alert("Success", "Structure Added 🚀");
      setClassLevel("");
      setBatch("");
      setSubjects("");
      fetchStructures();
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "DUPLICATE_STRUCTURE") {
        Alert.alert("Error", "This class and batch already exists");
        return;
      }

      Alert.alert("Error", "Failed to add");
    }
  };

  const grouped = groupAcademicByClass(structures).map((group) => ({
    title: `Class ${group.classLevel}`,
    data: group.batches,
  }));

  return (
    <ScreenContainer>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 20,
        }}
      >
        Academic Structure 🎓
      </Text>

      <CustomInput
        placeholder="Class (e.g. 11)"
        value={classLevel}
        onChangeText={setClassLevel}
      />

      <CustomInput
        placeholder="Batch (e.g. Morning)"
        value={batch}
        onChangeText={setBatch}
      />

      <CustomInput
        placeholder="Subjects (comma separated)"
        value={subjects}
        onChangeText={setSubjects}
      />

      <AuthButton title="Add Structure" onPress={handleAdd} />

      <SectionList
        sections={grouped}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 20 }}
        ListEmptyComponent={
          <Text style={{ color: "gray", marginTop: 20 }}>
            No academic structures yet.
          </Text>
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              marginTop: 20,
              marginBottom: 8,
            }}
          >
            {title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#f5f5f5",
              padding: 15,
              borderRadius: 10,
              marginBottom: 10,
              marginLeft: 8,
            }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
              Batch: {item.batch}
            </Text>
            <Text style={{ marginTop: 6 }}>
              Subjects: {item.subjects.join(", ")}
            </Text>
          </View>
        )}
      />
    </ScreenContainer>
  );
}
