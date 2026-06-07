export type UserRole = "owner" | "teacher" | "student";

export type AssignedSubject = {
  classLevel: string;
  batch: string;
  subject: string;
  teacherId?: string;
  teacherName?: string;
};

/** @deprecated use AssignedSubject */
export type AssignedBatch = AssignedSubject;

export type UserProfile = {
  name: string;
  mobile: string;
  role: UserRole;
  institutionCode: string | null;
  /** Primary model: all academic assignments live here. */
  assignedSubjects: AssignedSubject[];
  createdAt?: number;
  /** @deprecated Legacy fields — migrated into assignedSubjects on read. */
  assignedBatches?: AssignedBatch[];
  /** @deprecated */
  classLevel?: string;
  /** @deprecated */
  batch?: string;
  /** @deprecated */
  subjects?: string[];
};

export type UserProfileWithId = UserProfile & {
  id: string;
};
