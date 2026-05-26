import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
  } from "firebase/firestore";
  
  import { app } from "./config";
  
  const db = getFirestore(app);
  
  export const addAcademicStructure =
    async (
      data: any
    ) => {
  
      await addDoc(
        collection(
          db,
          "academicStructure"
        ),
        data
      );
  };
  
  export const getAcademicStructures =
    async () => {
  
      const snapshot =
        await getDocs(
          collection(
            db,
            "academicStructure"
          )
        );
  
      return snapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      );
  };