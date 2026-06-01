import { NextResponse } from "next/server";
import { isAllowedOnparEmail, isAllowedSignupEmail } from "@/lib/auth/allowlist";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ allowed: false });
  }

  if (isAllowedSignupEmail(email)) {
    return NextResponse.json({ allowed: true });
  }

  const local = email.split("@")[0];
  const domain = email.split("@")[1];

  try {
    const supabase = createServiceClient();

    const { data: fullEmail } = await supabase
      .from("signup_allowed_emails")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (fullEmail) {
      return NextResponse.json({ allowed: true });
    }

    if (!local || domain !== "onparbar.com") {
      return NextResponse.json({ allowed: false });
    }

    const { data } = await supabase
      .from("signup_allowlist")
      .select("local_part")
      .eq("local_part", local)
      .maybeSingle();

    return NextResponse.json({ allowed: Boolean(data) });
  } catch {
    return NextResponse.json({ allowed: isAllowedSignupEmail(email) });
  }
}
