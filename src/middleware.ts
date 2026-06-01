import { NextResponse, type NextRequest } from "next/server";
import {
  getManagerProfileRoleWithService,
  managerDashboardAllowed,
} from "@/lib/auth/session";
import { createMiddlewareSupabase } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const ctx = createMiddlewareSupabase(
    request,
    NextResponse.next({ request }),
  );
  if (!ctx) return NextResponse.next({ request });

  const { supabase } = ctx;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname.startsWith("/lead") || pathname.startsWith("/admin");
  const isLogin = pathname === "/login";

  if (user && (isLogin || isProtected)) {
    const role = await getManagerProfileRoleWithService(user.id);

    if (isLogin && managerDashboardAllowed(role)) {
      const next = request.nextUrl.searchParams.get("next") || "/lead";
      const dest = next.startsWith("/") ? next : "/lead";
      return NextResponse.redirect(new URL(dest, request.url));
    }

    if (isProtected && !managerDashboardAllowed(role)) {
      const login = new URL("/login", request.url);
      login.searchParams.set("error", "access");
      return NextResponse.redirect(login);
    }

    if (
      isProtected &&
      pathname.startsWith("/admin") &&
      role !== "admin"
    ) {
      return NextResponse.redirect(new URL("/lead", request.url));
    }
  }

  if (isProtected && !user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return ctx.getResponse();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
