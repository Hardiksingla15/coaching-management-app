import type { AssignedSubject, UserProfile } from "../types/user";

export function getSubjectSlotKey(slot: AssignedSubject): string {
  return `${slot.classLevel}::${slot.batch}::${slot.subject}`;
}

export function subjectSlotsEqual(a: AssignedSubject, b: AssignedSubject): boolean {
  return (
    a.classLevel === b.classLevel &&
    a.batch === b.batch &&
    a.subject === b.subject
  );
}

export function normalizeAssignedSubject(slot: AssignedSubject): AssignedSubject {
  const normalized: AssignedSubject = {
    classLevel: String(slot.classLevel).trim(),
    batch: String(slot.batch).trim(),
    subject: String(slot.subject).trim(),
  };

  const teacherId = slot.teacherId?.trim();
  const teacherName = slot.teacherName?.trim();

  if (teacherId) {
    normalized.teacherId = teacherId;
  }

  if (teacherName) {
    normalized.teacherName = teacherName;
  }

  return normalized;
}

/** Merges legacy batch fields into assignedSubjects when needed. */
export function normalizeUserAssignedSubjects(
  user: Partial<UserProfile> | null | undefined
): AssignedSubject[] {
  if (!user) {
    return [];
  }

  const primary = (user.assignedSubjects ?? [])
    .map(normalizeAssignedSubject)
    .filter((s) => s.classLevel && s.batch && s.subject);

  if (primary.length > 0) {
    return finalizeSlotsForRole(user.role, dedupeAssignedSubjects(primary));
  }

  const legacyBatches = (user.assignedBatches ?? [])
    .flatMap((item) =>
      item.subject
        ? [
            normalizeAssignedSubject({
              classLevel: item.classLevel,
              batch: item.batch,
              subject: item.subject,
              teacherId: item.teacherId,
              teacherName: item.teacherName,
            }),
          ]
        : []
    )
    .filter((s) => s.classLevel && s.batch && s.subject);

  if (legacyBatches.length > 0) {
    return finalizeSlotsForRole(user.role, dedupeAssignedSubjects(legacyBatches));
  }

  if (user.classLevel && user.batch && user.subjects?.length) {
    return finalizeSlotsForRole(
      user.role,
      dedupeAssignedSubjects(
        user.subjects.map((subject) =>
          normalizeAssignedSubject({
            classLevel: user.classLevel!,
            batch: user.batch!,
            subject,
          })
        )
      )
    );
  }

  return [];
}

function finalizeSlotsForRole(
  role: UserProfile["role"] | undefined,
  slots: AssignedSubject[]
): AssignedSubject[] {
  if (role === "teacher" || role === "owner") {
    return slots.map((s) => ({
      classLevel: s.classLevel,
      batch: s.batch,
      subject: s.subject,
    }));
  }
  return slots;
}

export function dedupeAssignedSubjects(slots: AssignedSubject[]): AssignedSubject[] {
  const map = new Map<string, AssignedSubject>();
  for (const slot of slots.map(normalizeAssignedSubject)) {
    const key = getSubjectSlotKey(slot);
    if (!map.has(key)) {
      map.set(key, slot);
    }
  }
  return Array.from(map.values());
}

export function formatSubjectSlotLabel(slot: AssignedSubject): string {
  const s = normalizeAssignedSubject(slot);
  return `Class ${s.classLevel} · ${s.batch} · ${s.subject}`;
}

export function formatSubjectSlotShort(slot: AssignedSubject): string {
  return `${slot.batch} · ${slot.subject}`;
}

// Backward compatibility exports to avoid breaking existing imports.
export const getBatchKey = getSubjectSlotKey;
export const batchesEqual = subjectSlotsEqual;
export const normalizeBatch = normalizeAssignedSubject;
export const normalizeUserBatches = normalizeUserAssignedSubjects;
export const dedupeBatches = dedupeAssignedSubjects;
export const formatBatchLabel = formatSubjectSlotLabel;
export const formatBatchShort = formatSubjectSlotShort;
