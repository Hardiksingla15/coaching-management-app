import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getAcademicStructures as fetchFromDb } from "../firebase/academic";
import type { AcademicStructure } from "../types/academic";

type AcademicContextType = {
  structures: AcademicStructure[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const AcademicContext = createContext<AcademicContextType | null>(null);

export function AcademicContextProvider({ children }: { children: React.ReactNode }) {
  const [structures, setStructures] = useState<AcademicStructure[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchFromDb();
      setStructures(data);
    } catch (error) {
      console.error("Failed to fetch academic structures:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AcademicContext.Provider value={{ structures, loading, refresh }}>
      {children}
    </AcademicContext.Provider>
  );
}

export function useAcademicContext() {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error("useAcademicContext must be used within AcademicContextProvider");
  }
  return context;
}
