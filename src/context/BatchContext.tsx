import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AssignedBatch } from "../types/user";
import { batchesEqual, dedupeBatches } from "../services/batchUtils";

type BatchContextValue = {
  batches: AssignedBatch[];
  activeBatch: AssignedBatch | null;
  setActiveBatch: (batch: AssignedBatch | null) => void;
  hasBatches: boolean;
};

const BatchContext = createContext<BatchContextValue | null>(null);

type Props = {
  children: ReactNode;
  batches: AssignedBatch[];
};

export function BatchContextProvider({ children, batches }: Props) {
  const normalizedBatches = useMemo(() => dedupeBatches(batches), [batches]);
  const [activeBatch, setActiveBatchState] = useState<AssignedBatch | null>(
    null
  );

  useEffect(() => {
    setActiveBatchState((current) => {
      if (normalizedBatches.length === 0) {
        return null;
      }

      if (
        current &&
        normalizedBatches.some((batch) => batchesEqual(batch, current))
      ) {
        return current;
      }

      return normalizedBatches[0];
    });
  }, [normalizedBatches]);

  const setActiveBatch = useCallback((batch: AssignedBatch | null) => {
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
