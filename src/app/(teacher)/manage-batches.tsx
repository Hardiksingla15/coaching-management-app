import {
    View,
    Text,
    Alert,
    FlatList,
  } from "react-native";
  
  import {
    useEffect,
    useState,
  } from "react";
  
  import ScreenContainer
    from "../../components/ScreenContainer";
  
  import CustomInput
    from "../../components/CustomInput";
  
  import AuthButton
    from "../../components/AuthButton";
  
  import {
    addAcademicStructure,
    getAcademicStructures,
  } from "../../firebase/academic";
  
  export default function ManageBatches() {
  
    const [classLevel,
      setClassLevel] =
      useState("");
  
    const [batch,
      setBatch] =
      useState("");
  
    const [subjects,
      setSubjects] =
      useState("");
  
    const [structures,
      setStructures] =
      useState<any[]>([]);
  
    const fetchStructures =
      async () => {
  
        const data =
          await getAcademicStructures();
  
        setStructures(data);
      };
  
    useEffect(() => {
  
      fetchStructures();
  
    }, []);
  
    const handleAdd =
      async () => {
  
        if (
          !classLevel ||
          !batch ||
          !subjects
        ) {
  
          Alert.alert(
            "Error",
            "Fill all fields"
          );
  
          return;
        }
  
        try {
  
          await addAcademicStructure({
  
            classLevel,
  
            batch,
  
            subjects:
              subjects
                .split(",")
                .map((s) =>
                  s.trim()
                ),
          });
  
          Alert.alert(
            "Success",
            "Structure Added 🚀"
          );
  
          setClassLevel("");
          setBatch("");
          setSubjects("");
  
          fetchStructures();
  
        } catch {
  
          Alert.alert(
            "Error",
            "Failed to add"
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
          Manage Batches 🎓
        </Text>
  
        <CustomInput
          placeholder="Class"
          value={classLevel}
          onChangeText={
            setClassLevel
          }
        />
  
        <CustomInput
          placeholder="Batch"
          value={batch}
          onChangeText={setBatch}
        />
  
        <CustomInput
          placeholder="Subjects"
          value={subjects}
          onChangeText={setSubjects}
        />
  
        <AuthButton
          title="Add Structure"
          onPress={handleAdd}
        />
  
        <FlatList
          data={structures}
  
          keyExtractor={(item) =>
            item.id
          }
  
          renderItem={({ item }) => (
  
            <View
              style={{
                backgroundColor:
                  "#f5f5f5",
  
                padding: 15,
  
                borderRadius: 10,
  
                marginTop: 15,
              }}
            >
  
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 18,
                }}
              >
                Class {item.classLevel}
              </Text>
  
              <Text>
                Batch:
                {" "}
                {item.batch}
              </Text>
  
              <Text>
                Subjects:
                {" "}
                {item.subjects.join(", ")}
              </Text>
  
            </View>
          )}
        />
  
      </ScreenContainer>
    );
  }
  