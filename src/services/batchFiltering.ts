import type { AssignedBatch } from "../types/user";
import { batchesEqual } from "./batchUtils";

export type BatchFilterable = {
  classLevel?: string;
  batch?: string;
  class?: string;
};

export function matchesActiveBatch(
  item: BatchFilterable,
  activeBatch: AssignedBatch | null
): boolean {
  if (!activeBatch || !item.batch) {
    return false;
  }

  const classLevel = item.classLevel ?? item.class ?? "";

  if (!classLevel) {
    return item.batch === activeBatch.batch;
  }

  return (
    classLevel === activeBatch.classLevel && item.batch === activeBatch.batch
  );
}

export function filterByActiveBatch<T extends BatchFilterable>(
  items: T[],
  activeBatch: AssignedBatch | null
): T[] {
  if (!activeBatch) {
    return [];
  }

  return items.filter((item) => matchesActiveBatch(item, activeBatch));
}

export function isBatchInList(
  batch: AssignedBatch,
  list: AssignedBatch[]
): boolean {
  return list.some((item) => batchesEqual(item, batch));
}
