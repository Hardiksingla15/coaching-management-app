import { useEffect, useState, useCallback } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

import { app } from "../firebase/config";
import { getUserData } from "../firebase/firestore";
import { normalizeUserAssignedSubjects } from "../services/batchUtils";
import type { UserProfile } from "../types/user";

export type CurrentUser = UserProfile & {
  uid: string;
};

export function useCurrentUser() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setProfile(null);
      return;
    }
    try {
      const data = await getUserData(currentUser.uid);
      if (data) {
        setProfile({
          uid: currentUser.uid,
          ...data,
          assignedSubjects: normalizeUserAssignedSubjects(data),
          institutionCode: data.institutionCode ?? null,
        });
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
    }
  }, []);

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const data = await getUserData(user.uid);

        if (data) {
          setProfile({
            uid: user.uid,
            ...data,
            assignedSubjects: normalizeUserAssignedSubjects(data),
            institutionCode: data.institutionCode ?? null,
          });
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return { firebaseUser, user: profile, loading, refreshProfile };
}

