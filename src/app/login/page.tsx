"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  isAllowedSignupEmail,
  parseLoginIdentifier,
} from "@/lib/auth/allowlist";
import {
  isValidPin,
  normalizePinInput,
  pinValidationMessage,
} from "@/lib/auth/pin";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  canAccessManagerDashboard,
  type UserRole,
} from "@/lib/types/profile";
import { VENUE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const pinInputClass =
  "mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-center text-2xl font-semibold tracking-[0.4em] outline-none focus:border-[#1a73e8] focus:bg-white focus:ring-2 focus:ring-[#1a73e8]/20";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/lead";
  const accessError = searchParams.get("error") === "access";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(
    accessError
      ? "Your account does not have manager access yet. Ask an admin."
      : "",
  );
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setCheckingSession(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const role = await fetchProfileRole();
      if (cancelled) return;
      if (role && canAccessManagerDashboard(role)) {
        router.replace(next);
        router.refresh();
        return;
      }
      setCheckingSession(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [next, router]);

  async function fetchProfileRole(): Promise<UserRole | null> {
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const res = await fetch("/api/auth/profile", { cache: "no-store" });
        const data = (await res.json()) as { profile?: { role?: UserRole } };
        if (data.profile?.role) return data.profile.role;
      } catch {
        /* retry */
      }
      await new Promise((resolve) =>
        setTimeout(resolve, 150 + attempt * 100),
      );
    }
    return null;
  }

  async function afterAuthRedirect(authMode: "signin" | "signup") {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const role = await fetchProfileRole();

    if (role && canAccessManagerDashboard(role)) {
      router.replace(next);
      router.refresh();
      return;
    }

    if (authMode === "signin") {
      setError(
        "Signed in, but manager access is not active yet. If you just created your account, wait a few seconds and try again — or ask an admin to set your role under Team permissions.",
      );
      return;
    }

    setMessage(
      "Account created. An admin must grant you Manager access in Team permissions before you can use the dashboard. Core team accounts are usually ready within a few seconds — try signing in.",
    );
  }

  function validatePinFields(): boolean {
    if (!isValidPin(pin)) {
      setError(pinValidationMessage());
      return false;
    }
    if (mode === "signup" && pin !== confirmPin) {
      setError("PINs do not match.");
      return false;
    }
    return true;
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    const { email } = parseLoginIdentifier(identifier);

    if (!validatePinFields()) {
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: pin,
    });

    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }

    await afterAuthRedirect("signin");
    setSubmitting(false);
  }

  async function canRegister(email: string): Promise<boolean> {
    if (isAllowedSignupEmail(email)) return true;
    try {
      const res = await fetch(
        `/api/auth/check-signup?email=${encodeURIComponent(email)}`,
      );
      const data = (await res.json()) as { allowed?: boolean };
      return Boolean(data.allowed);
    } catch {
      return false;
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    const { email, username } = parseLoginIdentifier(identifier);
    if (!(await canRegister(email))) {
      setError(
        "This email is not approved for sign-up. Ask an admin to add you under Team permissions.",
      );
      setSubmitting(false);
      return;
    }

    if (!validatePinFields()) {
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: pin,
      options: {
        data: {
          display_name: displayName.trim() || username,
          username,
        },
      },
    });

    if (signUpError) {
      const msg = signUpError.message.includes("Database error")
        ? "Account could not be created (server setup). Ask an admin to run the latest database fix in Supabase, then try again."
        : signUpError.message;
      setError(msg);
      setSubmitting(false);
      return;
    }

    if (data.session) {
      try {
        await fetch("/api/auth/complete-signup", { method: "POST" });
      } catch {
        /* trigger may have created profile */
      }
      await afterAuthRedirect("signup");
    } else {
      setMessage(
        "Check your email to confirm your account, then sign in. If confirmation is off in Supabase, try signing in now.",
      );
    }
    setSubmitting(false);
  }

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base outline-none focus:border-[#1a73e8] focus:bg-white focus:ring-2 focus:ring-[#1a73e8]/20";

  return (
    <div className="mobile-shell flex min-h-[100dvh] flex-col px-5 py-8 safe-bottom">
      <Link href="/" className="text-sm font-medium text-[#1a73e8]">
        ← Home
      </Link>

      <div className="mx-auto mt-6 w-full max-w-md flex-1">
        <div className="surface-card p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            {VENUE_NAME}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">Team sign in</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Use your On Par username or email, then your 6-digit PIN.
          </p>

          <div className="mt-5 flex rounded-lg border border-zinc-200 p-0.5">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-semibold",
                mode === "signin"
                  ? "bg-[#1a73e8] text-white"
                  : "text-zinc-600",
              )}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-semibold",
                mode === "signup"
                  ? "bg-[#1a73e8] text-white"
                  : "text-zinc-600",
              )}
            >
              Create account
            </button>
          </div>

          {checkingSession ? (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking this device…
            </div>
          ) : null}

          {!checkingSession && !isSupabaseConfigured() ? (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              App is not connected to the server. Check environment variables.
            </p>
          ) : null}

          {!checkingSession && error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          {!checkingSession && message ? (
            <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
              {message}
            </p>
          ) : null}

          {!checkingSession ? (
          <>
          <form
            onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
            className="mt-5 space-y-4"
          >
            <label className="block text-sm font-semibold text-zinc-900">
              Email or username
              <input
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={fieldClass}
              />
            </label>

            {mode === "signup" ? (
              <label className="block text-sm font-semibold text-zinc-900">
                Display name (optional)
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={fieldClass}
                />
              </label>
            ) : null}

            <label className="block text-sm font-semibold text-zinc-900">
              {mode === "signup" ? "Create a 6-digit PIN" : "6-digit PIN"}
              <input
                required
                type="password"
                inputMode="numeric"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                maxLength={6}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(normalizePinInput(e.target.value))}
                className={pinInputClass}
              />
            </label>

            {mode === "signup" ? (
              <label className="block text-sm font-semibold text-zinc-900">
                Confirm 6-digit PIN
                <input
                  required
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={6}
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) =>
                    setConfirmPin(normalizePinInput(e.target.value))
                  }
                  className={pinInputClass}
                />
              </label>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a73e8] py-3.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Please wait…
                </>
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </button>
          </form>
          </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1a73e8]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
