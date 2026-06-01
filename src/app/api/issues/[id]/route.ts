import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MANAGER_SESSION_COOKIE } from "@/lib/constants";
import { createServiceClient } from "@/lib/supabase/server";
import type { WorkflowStatus } from "@/lib/types/issue";

async function requireManager() {
  const cookieStore = await cookies();
  if (cookieStore.get(MANAGER_SESSION_COOKIE)?.value !== "1") {
    return NextResponse.json({ error: "Manager login required" }, { status: 401 });
  }
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireManager();
  if (denied) return denied;

  const { id } = await params;
  const body = (await request.json()) as {
    action: "workflow" | "complete" | "recall";
    workflow_status?: WorkflowStatus;
    completion_note?: string;
  };

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server misconfigured" },
      { status: 500 },
    );
  }

  if (body.action === "workflow" && body.workflow_status) {
    const { data, error } = await supabase
      .from("issues")
      .update({
        workflow_status: body.workflow_status,
        status: "open",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ issue: data });
  }

  if (body.action === "complete") {
    const { data, error } = await supabase
      .from("issues")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completion_note: body.completion_note ?? null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ issue: data });
  }

  if (body.action === "recall") {
    const { data, error } = await supabase
      .from("issues")
      .update({
        status: "open",
        workflow_status: "open",
        recalled_at: new Date().toISOString(),
        completed_at: null,
        completion_note: null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ issue: data });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
