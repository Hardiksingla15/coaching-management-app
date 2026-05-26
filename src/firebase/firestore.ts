import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    updateDoc,
  } from "firebase/firestore";
  
  import { app } from "./config";
  
  const db = getFirestore(app);
  
  export const saveUserData = async (
    uid: string,
    data: any
  ) => {
  
    await setDoc(
      doc(db, "users", uid),
      data
    );
  };
  
  export const getUserData = async (
    uid: string
  ) => {
  
    const userRef = doc(db, "users", uid);
  
    const snapshot = await getDoc(userRef);
  
    return snapshot.data();
  };



  export const getUserByMobile = async (
    mobile: string
  ) => {
  
    const q = query(
      collection(db, "users"),
      where("mobile", "==", mobile)
    );
  
    const querySnapshot = await getDocs(q);
  
    if (querySnapshot.empty) {
      return null;
    }
  
    return querySnapshot.docs[0].data();
  };

  export const getAllStudents =
  async () => {

    const q = query(
      collection(db, "users"),
      where("role", "==", "student")
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
export const updateStudentData =
  async (
    id: string,
    data: any
  ) => {

    const userRef =
      doc(db, "users", id);

    await updateDoc(
      userRef,
      data
    );
};