import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { loadProfileByUserId } from "@/lib/auth/profile";
import { getSupabaseUrl } from "@/lib/supabase/env";
import {
  canAccessManagerDashboard,
  type UserRole,
} from "@/lib/types/profile";

export async function getManagerProfileRoleWithService(
  userId: string,
): Promise<UserRole | null> {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();
  const url = getSupabaseUrl();

  if (serviceKey && url) {
    const service = createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile } = await service
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    return (profile?.role as UserRole) ?? null;
  }

  const profile = await loadProfileByUserId(userId);
  return profile?.role ?? null;
}

export function managerDashboardAllowed(role: UserRole | null): boolean {
  return Boolean(role && canAccessManagerDashboard(role));
}
