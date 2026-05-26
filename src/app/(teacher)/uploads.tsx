import { useState } from "react";

import {
  View,
  Text,
  Alert,
} from "react-native";

import CustomInput
  from "../../components/CustomInput";

import AuthButton
  from "../../components/AuthButton";

import ScreenContainer
  from "../../components/ScreenContainer";

import { addNote }
  from "../../firebase/notes";

export default function TeacherNotes() {

  const [title, setTitle] =
    useState("");

  const [description,
    setDescription] =
    useState("");

  const [batch, setBatch] =
    useState("");

  const handleAddNote =
    async () => {

      if (
        !title ||
        !description ||
        !batch
      ) {

        Alert.alert(
          "Error",
          "Please fill all fields"
        );

        return;
      }

      try {

        await addNote({
          title,
          description,
          batch,
        });

        Alert.alert(
          "Success",
          "Note Added 🚀"
        );

        setTitle("");
        setDescription("");
        setBatch("");

      } catch {

        Alert.alert(
          "Error",
          "Failed to add note"
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
        Add Notes 📚
      </Text>

      <CustomInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />

      <CustomInput
        placeholder="Description"
        value={description}
        onChangeText={
          setDescription
        }
      />

      <CustomInput
        placeholder="Batch"
        value={batch}
        onChangeText={setBatch}
      />

      <AuthButton
        title="Add Note"
        onPress={handleAddNote}
      />

    </ScreenContainer>
  );
}