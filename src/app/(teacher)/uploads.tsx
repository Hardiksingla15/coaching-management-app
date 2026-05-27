import { useState } from "react";
import { Alert, Text } from "react-native";

import CustomInput from "../../components/CustomInput";
import AuthButton from "../../components/AuthButton";
import ScreenContainer from "../../components/ScreenContainer";
import ContextHeader from "../../components/batch/ContextHeader";
import EmptyState from "../../components/batch/EmptyState";
import { useBatchContext } from "../../context/BatchContext";
import { addNote } from "../../firebase/notes";

export default function TeacherNotes() {
  const { activeBatch } = useBatchContext();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");

  const handleAddNote = async () => {
    if (!activeBatch) {
      Alert.alert("Error", "Select a teaching batch on the dashboard");
      return;
    }

    if (!title || !description) {
      Alert.alert("Error", "Please fill title and description");
      return;
    }

    try {
      await addNote({
        title,
        description,
        classLevel: activeBatch.classLevel,
        batch: activeBatch.batch,
        subject: subject || activeBatch.subjects[0] || "",
      });

      Alert.alert("Success", "Note Added 🚀");
      setTitle("");
      setDescription("");
      setSubject("");
    } catch {
      Alert.alert("Error", "Failed to add note");
    }
  };

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 12 }}>
        Add Notes 📚
      </Text>

      <ContextHeader activeBatch={activeBatch} />

      {!activeBatch ? (
        <EmptyState message="Select an assigned batch on your dashboard first." />
      ) : (
        <>
          <CustomInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
          />

          <CustomInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />

          <CustomInput
            placeholder={`Subject (e.g. ${activeBatch.subjects.join(", ") || "Physics"})`}
            value={subject}
            onChangeText={setSubject}
          />

          <AuthButton title="Add Note" onPress={handleAddNote} />
        </>
      )}
    </ScreenContainer>
  );
}
