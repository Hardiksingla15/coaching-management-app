import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
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

  import {
    collection,
    query,
    where,
    getDocs,
  } from "firebase/firestore";

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