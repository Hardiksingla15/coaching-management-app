import { useMemo } from "react";

import { normalizeUserBatches } from "../services/batchUtils";
import { useCurrentUser } from "./useCurrentUser";

export function useUserBatches() {
  const { user, loading, firebaseUser } = useCurrentUser();

  const batches = useMemo(
    () => normalizeUserBatches(user ?? undefined),
    [user]
  );

  return {
    user,
    firebaseUser,
    batches,
    loading,
  };
}
