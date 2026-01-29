import { isAdmin, getUserRoleName } from "@/lib/types";

export function isStaff(user: any) {
  if (!user) return false;

  const roleName = getUserRoleName(user)?.toLowerCase();

  return (
    isAdmin(user) ||
    roleName === "photographer" ||
    !!user.photographer_id
  );
}
