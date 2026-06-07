import { useMemo } from "react";

import { normalizeUserAssignedSubjects } from "../services/batchUtils";
import { useCurrentUser } from "./useCurrentUser";

export function useUserBatches() {
  const { user, loading, firebaseUser } = useCurrentUser();

  const batches = useMemo(
    () => normalizeUserAssignedSubjects(user ?? undefined),
    [user]
  );

  return {
    user,
    firebaseUser,
    batches,
    loading,
  };
}
