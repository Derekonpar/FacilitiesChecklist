export type UserRole = "pending" | "staff" | "manager" | "admin";

export interface Profile {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export function canAccessManagerDashboard(role: UserRole): boolean {
  return role === "manager" || role === "admin";
}

export function canManageTeam(role: UserRole): boolean {
  return role === "admin";
}
