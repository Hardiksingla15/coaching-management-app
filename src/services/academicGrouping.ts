import type { AcademicStructure } from "../types/academic";

export type ClassGroup = {
  classLevel: string;
  batches: AcademicStructure[];
};

export function groupAcademicByClass(
  structures: AcademicStructure[]
): ClassGroup[] {
  const classMap = new Map<string, AcademicStructure[]>();

  for (const structure of structures) {
    const key = structure.classLevel;
    const list = classMap.get(key) ?? [];
    list.push(structure);
    classMap.set(key, list);
  }

  return Array.from(classMap.entries())
    .map(([classLevel, batches]) => ({
      classLevel,
      batches: batches.sort((a, b) => a.batch.localeCompare(b.batch)),
    }))
    .sort((a, b) => a.classLevel.localeCompare(b.classLevel));
}

export function findAcademicStructure(
  structures: AcademicStructure[],
  classLevel: string,
  batch: string
): AcademicStructure | undefined {
  return structures.find(
    (s) => s.classLevel === classLevel && s.batch === batch
  );
}
