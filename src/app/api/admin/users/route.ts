import { NextResponse } from "next/server";
import {
  ASSIGNABLE_ROLES,
  isAuthContext,
  requireAdminAuth,
} from "@/lib/auth/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/profile";

export async function GET() {
  const auth = await requireAdminAuth();
  if (!isAuthContext(auth)) return auth;

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server misconfigured" },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("username", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ users: data });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminAuth();
  if (!isAuthContext(auth)) return auth;

  const body = (await request.json()) as {
    userId?: string;
    role?: UserRole;
    display_name?: string | null;
  };

  if (!body.userId || !body.role) {
    return NextResponse.json(
      { error: "userId and role are required" },
      { status: 400 },
    );
  }

  if (!ASSIGNABLE_ROLES.includes(body.role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (body.userId === auth.userId && body.role !== "admin") {
    return NextResponse.json(
      { error: "You cannot remove your own admin access" },
      { status: 400 },
    );
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server misconfigured" },
      { status: 500 },
    );
  }

  const update: Record<string, unknown> = { role: body.role };
  if ("display_name" in body) {
    update.display_name = body.display_name;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", body.userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data });
}
