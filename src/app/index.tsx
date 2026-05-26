import { useEffect } from "react";

import { useRouter } from "expo-router";

import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

import { app } from "../firebase/config";

export default function Index() {

  const router = useRouter();

  useEffect(() => {

    const auth = getAuth(app);

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {

          if (user) {

            router.replace(
              "/loading"
            );

          } else {

            router.replace(
              "/(auth)/login"
            );
          }
        }
      );

    return unsubscribe;

  }, []);

  return null;
}