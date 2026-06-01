import { NextResponse } from "next/server";
import {
  AUTO_ADMIN_LOCAL_PARTS,
  isAllowedSignupEmail,
} from "@/lib/auth/allowlist";
import { loadProfileByUserId } from "@/lib/auth/profile";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/profile";

function isAutoAdminEmail(email: string): boolean {
  const local = email.split("@")[0]?.toLowerCase();
  return (AUTO_ADMIN_LOCAL_PARTS as readonly string[]).includes(local ?? "");
}

/** Creates profile if auth user exists but trigger failed (idempotent). */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const email = user.email.trim().toLowerCase();
  if (!isAllowedSignupEmail(email)) {
    return NextResponse.json(
      { error: "This email is not approved for sign-up" },
      { status: 403 },
    );
  }

  const existing = await loadProfileByUserId(user.id);
  if (existing) {
    return NextResponse.json({ profile: existing, created: false });
  }

  const localPart = email.split("@")[0] ?? "user";
  let role: UserRole = "pending";

  try {
    const service = createServiceClient();
    const { data: allowRow } = await service
      .from("signup_allowlist")
      .select("auto_admin")
      .eq("local_part", localPart)
      .maybeSingle();

    if (allowRow?.auto_admin) {
      role = "admin";
    } else if (isAutoAdminEmail(email)) {
      role = "admin";
    }
  } catch {
    if (isAutoAdminEmail(email)) role = "admin";
  }

  let service;
  try {
    service = createServiceClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server misconfigured" },
      { status: 500 },
    );
  }

  const displayName =
    (user.user_metadata?.display_name as string | undefined)?.trim() ||
    localPart.charAt(0).toUpperCase() + localPart.slice(1);

  const { data: profile, error } = await service
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        username: localPart,
        display_name: displayName,
        role,
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ profile, created: true });
}
