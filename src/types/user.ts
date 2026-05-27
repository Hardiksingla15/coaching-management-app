export type UserRole = "owner" | "teacher" | "student";

export type AssignedBatch = {
  classLevel: string;
  batch: string;
  subjects: string[];
};

export type UserProfile = {
  name: string;
  mobile: string;
  role: UserRole;
  institutionCode: string | null;
  /** Primary model: all batch assignments live here. */
  assignedBatches: AssignedBatch[];
  createdAt?: number;
  /** @deprecated Legacy fields — migrated into assignedBatches on read. */
  classLevel?: string;
  /** @deprecated */
  batch?: string;
  /** @deprecated */
  subjects?: string[];
};

export type UserProfileWithId = UserProfile & {
  id: string;
};
