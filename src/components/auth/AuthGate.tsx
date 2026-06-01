"use client";

import Link from "next/link";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { canAccessManagerDashboard } from "@/lib/types/profile";
import { VENUE_NAME } from "@/lib/constants";

type AuthGateProps = {
  children: React.ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="mobile-shell flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a73e8]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mobile-shell flex min-h-[100dvh] flex-col items-center justify-center px-6 safe-bottom">
        <div className="surface-card w-full max-w-sm p-8 text-center">
          <h1 className="text-xl font-bold text-zinc-900">Sign in required</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {VENUE_NAME} manager dashboard uses your team account.
          </p>
          <Link
            href="/login?next=/lead"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#1a73e8] py-3.5 text-sm font-semibold text-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!profile || !canAccessManagerDashboard(profile.role)) {
    const isPending = profile?.role === "pending";
    return (
      <div className="mobile-shell flex min-h-[100dvh] flex-col items-center justify-center px-6 safe-bottom">
        <div className="surface-card w-full max-w-sm p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-zinc-900">
            {isPending ? "Access pending" : "Setting up your account"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Signed in as <span className="font-medium">{profile?.email ?? user.email}</span>.
            {isPending ? (
              <>
                {" "}
                An admin must set you to <strong>Manager</strong> in Team
                permissions before you can use the dashboard.
              </>
            ) : (
              <>
                {" "}
                Your profile is still being created. Refresh this page, or ask an
                admin to check Team permissions.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-800"
          >
            Refresh
          </button>
          <Link
            href="/"
            className="mt-3 inline-block text-sm font-medium text-[#1a73e8]"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
