"use client";

import { useEffect, useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { VENUE_NAME } from "@/lib/constants";

type PinGateProps = {
  children: React.ReactNode;
};

export function PinGate({ children }: PinGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/manager/check")
      .then((r) => r.json())
      .then((data: { ok?: boolean }) => {
        if (data.ok) setUnlocked(true);
      })
      .finally(() => setChecking(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Incorrect PIN. Ask a manager for access.");
        return;
      }
      setUnlocked(true);
    } catch {
      setError("Could not verify PIN. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="mobile-shell flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a73e8]" />
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="mobile-shell flex min-h-[100dvh] flex-col items-center justify-center px-6 safe-bottom">
      <div className="surface-card w-full max-w-sm p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a73e8]/10 text-[#1a73e8]">
          <Lock className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <h1 className="mt-5 text-center text-xl font-bold text-zinc-900">
          Manager access
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-zinc-500">
          {VENUE_NAME} — enter the shared manager PIN to view and update issues
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-center text-lg tracking-[0.2em] outline-none focus:border-[#1a73e8] focus:bg-white focus:ring-2 focus:ring-[#1a73e8]/20"
          />
          {error ? (
            <p className="text-center text-sm text-red-600">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#1a73e8] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1a73e8]/25 hover:bg-[#1557b0] disabled:opacity-60 active:scale-[0.98]"
          >
            {submitting ? "Checking…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
