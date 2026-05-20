import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
  } from "firebase/auth";
  
  import { app } from "./config";
  
  const auth = getAuth(app);
  
  export const signupUser = async (
    mobile: string,
    password: string
  ) => {
  
    const fakeEmail = `${mobile}@student.com`;
  
    return await createUserWithEmailAndPassword(
      auth,
      fakeEmail,
      password
    );
  };
  
  export const loginUser = async (
    mobile: string,
    password: string
  ) => {
  
    const fakeEmail = `${mobile}@student.com`;
  
    return await signInWithEmailAndPassword(
      auth,
      fakeEmail,
      password
    );
  };