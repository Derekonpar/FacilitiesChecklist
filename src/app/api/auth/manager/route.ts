import { NextResponse } from "next/server";
import {
  isValidManagerPin,
  MANAGER_SESSION_COOKIE,
} from "@/lib/auth/manager";

export async function POST(request: Request) {
  const body = (await request.json()) as { pin?: string };
  const pin = body.pin?.trim() ?? "";

  if (!process.env.MANAGER_PIN) {
    return NextResponse.json(
      { error: "MANAGER_PIN is not configured on the server" },
      { status: 500 },
    );
  }

  if (!isValidManagerPin(pin)) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(MANAGER_SESSION_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(MANAGER_SESSION_COOKIE);
  return res;
}
