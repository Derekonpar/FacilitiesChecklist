import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MANAGER_SESSION_COOKIE } from "@/lib/constants";

export async function GET() {
  const cookieStore = await cookies();
  const ok = cookieStore.get(MANAGER_SESSION_COOKIE)?.value === "1";
  return NextResponse.json({ ok });
}
