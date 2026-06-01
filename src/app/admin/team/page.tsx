"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import type { Profile, UserRole } from "@/lib/types/profile";
import { canManageTeam } from "@/lib/types/profile";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<UserRole, string> = {
  pending: "Pending — no dashboard",
  staff: "Staff — submit only",
  manager: "Manager — full dashboard",
  admin: "Admin — dashboard + team",
};

function TeamAdmin() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = (await res.json()) as { users?: Profile[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load team");
      setUsers(data.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile && canManageTeam(profile.role)) load();
  }, [profile, load]);

  async function updateRole(userId: string, role: UserRole) {
    setSavingId(userId);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  if (!profile || !canManageTeam(profile.role)) {
    return (
      <div className="mobile-shell p-8 text-center">
        <p className="text-zinc-600">Admin access required.</p>
        <Link href="/lead" className="mt-4 inline-block text-[#1a73e8]">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mobile-shell min-h-[100dvh] bg-[#f4f5f7]">
      <header className="border-b border-zinc-200 bg-white px-4 py-3">
        <Link
          href="/lead"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#1a73e8]"
        >
          <ChevronLeft className="h-5 w-5" />
          Dashboard
        </Link>
        <h1 className="mt-2 text-xl font-bold text-zinc-900">Team permissions</h1>
        <p className="text-sm text-zinc-600">
          Grant or revoke manager access for On Par accounts.
        </p>
      </header>

      <div className="p-4">
        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#1a73e8]" />
          </div>
        ) : (
          <ul className="space-y-3">
            {users.map((u) => (
              <li
                key={u.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {u.display_name ?? u.username}
                    </p>
                    <p className="text-sm text-zinc-500">
                      @{u.username} · {u.email}
                    </p>
                  </div>
                  <select
                    value={u.role}
                    disabled={savingId === u.id}
                    onChange={(e) =>
                      updateRole(u.id, e.target.value as UserRole)
                    }
                    className={cn(
                      "rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium",
                      u.role === "admin" && "border-indigo-300 bg-indigo-50",
                      u.role === "manager" && "border-teal-300 bg-teal-50",
                    )}
                  >
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function AdminTeamPage() {
  return (
    <AuthGate>
      <TeamAdmin />
    </AuthGate>
  );
}
