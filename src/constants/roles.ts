import type { UserRole } from "../types/user";

export const ROLES: Record<Uppercase<UserRole>, UserRole> = {
  OWNER: "owner",
  TEACHER: "teacher",
  STUDENT: "student",
};

export const TEACHING_ROLES: UserRole[] = ["owner", "teacher"];
