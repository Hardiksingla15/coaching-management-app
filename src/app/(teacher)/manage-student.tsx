import {
  View,
  Text,
  Alert,
} from "react-native";

import {
  useLocalSearchParams,
} from "expo-router";

import {
  useState,
  useEffect,
} from "react";

import { Picker }
from "@react-native-picker/picker";

import {
  getDoc,
  doc,
  getFirestore,
} from "firebase/firestore";

import ScreenContainer
from "../../components/ScreenContainer";

import AuthButton
from "../../components/AuthButton";

import {
  updateStudentData,
} from "../../firebase/firestore";

import {
  getAcademicStructures,
} from "../../firebase/academic";

import { app }
from "../../firebase/config";

export default function ManageStudent() {
  
  const [selectedClass,
    setSelectedClass] =
    useState("");
  
  const [selectedBatch,
    setSelectedBatch] =
    useState("");
  
  const [selectedSubject,
    setSelectedSubject] =
    useState("");

  const params =
    useLocalSearchParams();

  const [student,
    setStudent] =
    useState<any>(null);

  const [structures,
    setStructures] =
    useState<any[]>([]);

  const [selectedId,
    setSelectedId] =
    useState("");

  const fetchStructures =
    async () => {

      try {

        const data =
          await getAcademicStructures();

        setStructures(data);

      } catch {

        Alert.alert(
          "Error",
          "Failed to load batches"
        );
      }
    };

  const fetchStudent =
    async () => {

      try {

        const db =
          getFirestore(app);

        const snapshot =
          await getDoc(

            doc(
              db,
              "users",
              String(params.id)
            )
          );

        if (snapshot.exists()) {

          setStudent(
            snapshot.data()
          );
        }

      } catch {

        Alert.alert(
          "Error",
          "Failed to load student"
        );
      }
    };

  useEffect(() => {

    fetchStructures();

    fetchStudent();

  }, []);
  
  const uniqueClasses =
  [
    ...new Set(
      structures.map(
        (s) => s.classLevel
      )
    ),
  ];

  const filteredBatches =
    structures.filter(
      (s) =>
        s.classLevel ===
        selectedClass
    );

  const selectedBatchData =
    structures.find(
      (s) =>
        s.batch ===
        selectedBatch
    );

  const handleSave =
  async () => {

    if (
      !selectedClass ||
      !selectedBatch ||
      !selectedSubject
    ) {

      Alert.alert(
        "Error",
        "Select all fields"
      );

      return;
    }

    try {

      await updateStudentData(
        String(params.id),
        {
          classLevel:
            selectedClass,

          batch:
            selectedBatch,

          subjects: [
            selectedSubject
          ],
        }
      );

      Alert.alert(
        "Success",
        "Student Assigned 🚀"
      );

      fetchStudent();

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Error",
        "Assignment failed"
      );
    }
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
        Assign Student 🎓
      </Text>

      {student && (

        <View
          style={{
            backgroundColor:
              "#f5f5f5",

            padding: 15,

            borderRadius: 10,

            marginBottom: 20,
          }}
        >

          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
            }}
          >
            {student.name}
          </Text>

          <Text
            style={{
              marginTop: 5,
              color: "gray",
            }}
          >
            {student.mobile}
          </Text>

          <Text
            style={{
              marginTop: 10,
            }}
          >
            Current Class:
            {" "}
            {student.classLevel ||
              "Not Assigned"}
          </Text>

          <Text>
            Current Batch:
            {" "}
            {student.batch ||
              "Not Assigned"}
          </Text>

        </View>
      )}

<View
  style={{
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 20,
  }}
>

  <Picker
    selectedValue={selectedClass}

    onValueChange={(value) => {

      setSelectedClass(value);

      setSelectedBatch("");

      setSelectedSubject("");
    }}
  >

    <Picker.Item
      label="Select Class"
      value=""
    />

    {uniqueClasses.map((cls) => (

      <Picker.Item
        key={cls}
        label={`Class ${cls}`}
        value={cls}
      />
    ))}

  </Picker>

</View>

<View
  style={{
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 20,
  }}
>

  <Picker
    selectedValue={selectedBatch}

    onValueChange={(value) => {

      setSelectedBatch(value);

      setSelectedSubject("");
    }}
  >

    <Picker.Item
      label="Select Batch"
      value=""
    />

    {filteredBatches.map((item) => (

      <Picker.Item
        key={item.id}
        label={item.batch}
        value={item.batch}
      />
    ))}

  </Picker>

</View>

<View
  style={{
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 20,
  }}
>

  <Picker
    selectedValue={selectedSubject}

    onValueChange={(value) =>
      setSelectedSubject(value)
    }
  >

    <Picker.Item
      label="Select Subject"
      value=""
    />

    {selectedBatchData?.subjects?.map(
      (subject: string) => (

        <Picker.Item
          key={subject}
          label={subject}
          value={subject}
        />
      )
    )}

  </Picker>

</View>

      <AuthButton
        title="Assign Student"
        onPress={handleSave}
      />

    </ScreenContainer>
  );
}