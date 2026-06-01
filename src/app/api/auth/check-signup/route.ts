import { NextResponse } from "next/server";
import { isAllowedOnparEmail } from "@/lib/auth/allowlist";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ allowed: false });
  }

  if (isAllowedOnparEmail(email)) {
    return NextResponse.json({ allowed: true });
  }

  const local = email.split("@")[0];
  if (!local || email.split("@")[1] !== "onparbar.com") {
    return NextResponse.json({ allowed: false });
  }

  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("signup_allowlist")
      .select("local_part")
      .eq("local_part", local)
      .maybeSingle();

    return NextResponse.json({ allowed: Boolean(data) });
  } catch {
    return NextResponse.json({ allowed: isAllowedOnparEmail(email) });
  }
}
