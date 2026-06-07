import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AssignedSubject } from "../types/user";
import { dedupeAssignedSubjects, subjectSlotsEqual } from "../services/batchUtils";

type BatchContextValue = {
  batches: AssignedSubject[];
  activeBatch: AssignedSubject | null;
  setActiveBatch: (batch: AssignedSubject | null) => void;
  hasBatches: boolean;
};

const BatchContext = createContext<BatchContextValue | null>(null);

type Props = {
  children: ReactNode;
  batches: AssignedSubject[];
};

export function BatchContextProvider({ children, batches }: Props) {
  const normalizedBatches = useMemo(() => dedupeAssignedSubjects(batches), [batches]);
  const [activeBatch, setActiveBatchState] = useState<AssignedSubject | null>(
    null
  );

  useEffect(() => {
    setActiveBatchState((current) => {
      if (normalizedBatches.length === 0) {
        return null;
      }

      if (
        current &&
        normalizedBatches.some((batch) => subjectSlotsEqual(batch, current))
      ) {
        return current;
      }

      return normalizedBatches[0];
    });
  }, [normalizedBatches]);

  const setActiveBatch = useCallback((batch: AssignedSubject | null) => {
    setActiveBatchState(batch);
  }, []);

  const value = useMemo(
    () => ({
      batches: normalizedBatches,
      activeBatch,
      setActiveBatch,
      hasBatches: normalizedBatches.length > 0,
    }),
    [normalizedBatches, activeBatch, setActiveBatch]
  );

  return (
    <BatchContext.Provider value={value}>{children}</BatchContext.Provider>
  );
}

export function useBatchContext() {
  const context = useContext(BatchContext);

  if (!context) {
    throw new Error("useBatchContext must be used within BatchContextProvider");
  }

  return context;
}
