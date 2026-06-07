import type { AssignedSubject } from "../types/user";
import { subjectSlotsEqual } from "./batchUtils";

export type BatchFilterable = {
  classLevel?: string;
  batch?: string;
  subject?: string;
  class?: string;
};

export function matchesActiveBatch(
  item: BatchFilterable,
  activeBatch: AssignedSubject | null
): boolean {
  if (!activeBatch || !item.batch || !item.subject) {
    return false;
  }

  const classLevel = item.classLevel ?? item.class ?? "";
  return (
    classLevel === activeBatch.classLevel &&
    item.batch === activeBatch.batch &&
    item.subject === activeBatch.subject
  );
}

export function filterByActiveBatch<T extends BatchFilterable>(
  items: T[],
  activeBatch: AssignedSubject | null
): T[] {
  if (!activeBatch) {
    return [];
  }

  return items.filter((item) => matchesActiveBatch(item, activeBatch));
}

export function isBatchInList(
  batch: AssignedSubject,
  list: AssignedSubject[]
): boolean {
  return list.some((item) => subjectSlotsEqual(item, batch));
}
