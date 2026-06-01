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
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5f7]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a73e8]" />
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f5f7] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1a73e8]/10 text-[#1a73e8]">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-center text-xl font-semibold text-zinc-900">
          Manager access
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          {VENUE_NAME} — shared manager PIN required to view and update issues
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
          />
          {error ? (
            <p className="text-center text-sm text-red-600">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#1a73e8] py-3 text-sm font-semibold text-white hover:bg-[#1557b0] disabled:opacity-60"
          >
            {submitting ? "Checking…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
