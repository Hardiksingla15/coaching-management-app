import type { AssignedBatch, UserProfile } from "../types/user";

export function getBatchKey(batch: AssignedBatch): string {
  return `${batch.classLevel}::${batch.batch}`;
}

export function batchesEqual(a: AssignedBatch, b: AssignedBatch): boolean {
  return a.classLevel === b.classLevel && a.batch === b.batch;
}

export function normalizeBatch(batch: AssignedBatch): AssignedBatch {
  return {
    classLevel: String(batch.classLevel).trim(),
    batch: String(batch.batch).trim(),
    subjects: [...new Set((batch.subjects ?? []).map((s) => s.trim()).filter(Boolean))],
  };
}

/** Merges legacy classLevel/batch/subjects into assignedBatches when needed. */
export function normalizeUserBatches(
  user: Partial<UserProfile> | null | undefined
): AssignedBatch[] {
  if (!user) {
    return [];
  }

  const fromArray = (user.assignedBatches ?? []).map(normalizeBatch).filter(
    (b) => b.classLevel && b.batch
  );

  if (fromArray.length > 0) {
    return dedupeBatches(fromArray);
  }

  if (user.classLevel && user.batch) {
    return [
      normalizeBatch({
        classLevel: user.classLevel,
        batch: user.batch,
        subjects: user.subjects ?? [],
      }),
    ];
  }

  return [];
}

export function dedupeBatches(batches: AssignedBatch[]): AssignedBatch[] {
  const map = new Map<string, AssignedBatch>();

  for (const batch of batches.map(normalizeBatch)) {
    const key = getBatchKey(batch);
    const existing = map.get(key);

    if (existing) {
      map.set(key, {
        ...existing,
        subjects: [
          ...new Set([...(existing.subjects ?? []), ...(batch.subjects ?? [])]),
        ],
      });
    } else {
      map.set(key, batch);
    }
  }

  return Array.from(map.values());
}

export function formatBatchLabel(batch: AssignedBatch): string {
  const normalized = normalizeBatch(batch);
  const subjectText =
    normalized.subjects.length > 0
      ? ` · ${normalized.subjects.join(", ")}`
      : "";

  return `Class ${normalized.classLevel} · ${normalized.batch}${subjectText}`;
}

export function formatBatchShort(batch: AssignedBatch): string {
  return `Class ${batch.classLevel} · ${batch.batch}`;
}
