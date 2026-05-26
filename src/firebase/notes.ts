import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
  } from "firebase/firestore";
  
  import { app } from "./config";
  
  const db = getFirestore(app);
  
  export const addNote = async (
    data: any
  ) => {
  
    await addDoc(
      collection(db, "notes"),
      {
        ...data,
        createdAt: Date.now(),
      }
    );
  };
  
  export const getNotes = async () => {
  
    const q = query(
      collection(db, "notes"),
      orderBy("createdAt", "desc")
    );
  
    const snapshot =
      await getDocs(q);
  
    return snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    );
  };