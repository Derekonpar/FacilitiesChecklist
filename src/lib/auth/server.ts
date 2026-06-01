import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types/profile";
import { canAccessManagerDashboard, canManageTeam } from "@/lib/types/profile";

export type AuthContext = {
  userId: string;
  email: string;
  profile: Profile;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return null;

  return {
    userId: user.id,
    email: user.email,
    profile: profile as Profile,
  };
}

export async function requireManagerAuth(): Promise<
  AuthContext | NextResponse
> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!canAccessManagerDashboard(ctx.profile.role)) {
    return NextResponse.json(
      { error: "Manager access not granted for this account" },
      { status: 403 },
    );
  }
  return ctx;
}

export async function requireAdminAuth(): Promise<AuthContext | NextResponse> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!canManageTeam(ctx.profile.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  return ctx;
}

export function isAuthContext(
  value: AuthContext | NextResponse,
): value is AuthContext {
  return "profile" in value && "userId" in value;
}

export const ASSIGNABLE_ROLES: UserRole[] = [
  "pending",
  "staff",
  "manager",
  "admin",
];
