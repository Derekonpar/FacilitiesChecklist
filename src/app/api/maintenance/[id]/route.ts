import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MANAGER_SESSION_COOKIE } from "@/lib/constants";
import { createServiceClient } from "@/lib/supabase/server";
import type { MaintenanceUpdatePayload } from "@/lib/types/maintenance";

async function requireManager() {
  const cookieStore = await cookies();
  if (cookieStore.get(MANAGER_SESSION_COOKIE)?.value !== "1") {
    return NextResponse.json({ error: "Manager login required" }, { status: 401 });
  }
  return null;
}

const FIELDS = [
  "title",
  "next_service_date",
  "frequency_label",
  "last_serviced_date",
  "company",
  "poc_name",
  "poc_phone",
  "email",
  "monthly_cost",
  "account_number",
  "notes",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireManager();
  if (denied) return denied;

  const { id } = await params;
  const body = (await request.json()) as MaintenanceUpdatePayload;

  const update: Record<string, string | null> = {};
  for (const key of FIELDS) {
    if (key in body) {
      const val = body[key];
      update[key] = val === "" ? null : (val ?? null);
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  if ("title" in update && (!update.title || update.title.trim().length < 2)) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
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
    .from("maintenance_items")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ item: data });
}
