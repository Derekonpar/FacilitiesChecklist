import { NextResponse } from "next/server";
import { isAuthContext, requireAdminAuth } from "@/lib/auth/server";
import { buildOnparEmail } from "@/lib/auth/allowlist";
import { createServiceClient } from "@/lib/supabase/server";

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
    .from("signup_allowlist")
    .select("local_part, auto_admin, created_at")
    .order("local_part");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ entries: data });
}

export async function POST(request: Request) {
  const auth = await requireAdminAuth();
  if (!isAuthContext(auth)) return auth;

  const body = (await request.json()) as { local_part?: string };
  const local = body.local_part?.trim().toLowerCase();

  if (!local || !/^[a-z0-9._-]+$/.test(local)) {
    return NextResponse.json(
      { error: "Enter a valid username (letters, numbers, . _ -)" },
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

  const { data, error } = await supabase
    .from("signup_allowlist")
    .upsert(
      { local_part: local, auto_admin: false },
      { onConflict: "local_part" },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    entry: data,
    email: buildOnparEmail(local),
    message:
      "They can create an account at /login. Set their role under Team permissions after they sign up.",
  });
}
