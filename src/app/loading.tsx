import {
    View,
    ActivityIndicator,
  } from "react-native";
  
  import { useEffect } from "react";
  
  import { useRouter } from "expo-router";
  
  import {
    getAuth,
    onAuthStateChanged,
  } from "firebase/auth";
  
  import { app } from "../firebase/config";
  
  import { getUserData }
    from "../firebase/firestore";
  
  export default function LoadingScreen() {
  
    const router = useRouter();
  
    useEffect(() => {
  
      const auth = getAuth(app);
  
      const unsubscribe =
        onAuthStateChanged(
          auth,
          async (user) => {
  
            if (!user) {
  
              router.replace(
                "/(auth)/login"
              );
  
              return;
            }
  
            const userData =
              await getUserData(
                user.uid
              );
  
            if (!userData) {
  
              router.replace(
                "/(auth)/login"
              );
  
              return;
            }
  
            if (
              userData.role === "student"
            ) {
  
              router.replace(
                "/(student)/dashboard"
              );
  
            } else {
  
              router.replace(
                "/(teacher)/dashboard"
              );
            }
          }
        );
  
      return unsubscribe;
  
    }, []);
  
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }