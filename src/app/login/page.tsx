"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  ALLOWED_EMAIL_LOCAL_PARTS,
  allowedEmailsHint,
  isAllowedOnparEmail,
  parseLoginIdentifier,
} from "@/lib/auth/allowlist";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  canAccessManagerDashboard,
  type UserRole,
} from "@/lib/types/profile";
import { VENUE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/lead";
  const accessError = searchParams.get("error") === "access";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(
    accessError
      ? "Your account does not have manager access yet. Ask an admin."
      : "",
  );
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function afterAuthRedirect() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile && canAccessManagerDashboard(profile.role as UserRole)) {
      router.replace(next);
      router.refresh();
    } else {
      setMessage(
        "Account ready. An admin must grant you Manager access before using the dashboard.",
      );
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    const { email } = parseLoginIdentifier(identifier);
    if (!isAllowedOnparEmail(email)) {
      setError("Use your @onparbar.com team email or username.");
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }

    await afterAuthRedirect();
    setSubmitting(false);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    const { email, username } = parseLoginIdentifier(identifier);
    if (!isAllowedOnparEmail(email)) {
      setError(
        `Only these emails can register: ${allowedEmailsHint()}`,
      );
      setSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setSubmitting(false);
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim() || username,
          username,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    if (data.session) {
      await afterAuthRedirect();
    } else {
      setMessage(
        "Check your email to confirm your account, then sign in. If confirmation is disabled, try signing in now.",
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
            Use your On Par email or username (e.g.{" "}
            <span className="font-medium">derek</span> or{" "}
            <span className="font-medium">derek@onparbar.com</span>).
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

          {!isSupabaseConfigured() ? (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              App is not connected to the server. Check environment variables.
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
              {message}
            </p>
          ) : null}

          <form
            onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
            className="mt-5 space-y-4"
          >
            <label className="block text-sm font-semibold text-zinc-900">
              Email or username
              <input
                required
                autoComplete="username"
                placeholder="derek or derek@onparbar.com"
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
                  placeholder="Derek"
                />
              </label>
            ) : null}

            <label className="block text-sm font-semibold text-zinc-900">
              Password
              <input
                required
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
              />
            </label>

            {mode === "signup" ? (
              <label className="block text-sm font-semibold text-zinc-900">
                Confirm password
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={fieldClass}
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

          <p className="mt-5 text-xs leading-relaxed text-zinc-500">
            Allowed accounts:{" "}
            {ALLOWED_EMAIL_LOCAL_PARTS.map((p) => (
              <span key={p} className="font-medium text-zinc-700">
                {p}@onparbar.com{" "}
              </span>
            ))}
          </p>
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
