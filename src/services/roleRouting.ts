import type { UserRole } from "../types/user";

export function getDashboardPath(role: UserRole | string | undefined): string {
  switch (role) {
    case "owner":
      return "/(owner)/dashboard";
    case "teacher":
      return "/(teacher)/dashboard";
    case "student":
      return "/(student)/dashboard";
    default:
      return "/(auth)/login";
  }
}

export function isTeachingRole(role: string | undefined): boolean {
  return role === "owner" || role === "teacher";
}
