"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, Wrench } from "lucide-react";
import { formatIssueDateTime } from "@/lib/format";
import type {
  MaintenanceItem,
  MaintenanceUpdatePayload,
} from "@/lib/types/maintenance";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-[#1a73e8] focus:bg-white focus:ring-2 focus:ring-[#1a73e8]/20";

type MaintenanceDetailPanelProps = {
  item: MaintenanceItem;
  variant?: "desktop" | "mobile";
  disabled?: boolean;
  onBack?: () => void;
  onSaved?: (item: MaintenanceItem) => void;
};

export function MaintenanceDetailPanel({
  item,
  variant = "desktop",
  disabled,
  onBack,
  onSaved,
}: MaintenanceDetailPanelProps) {
  const [form, setForm] = useState(() => formFromItem(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isMobile = variant === "mobile";

  useEffect(() => {
    setForm(formFromItem(item));
    setError(null);
    setSaved(false);
  }, [item]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    const payload: MaintenanceUpdatePayload = {
      title: form.title.trim(),
      next_service_date: form.next_service_date || null,
      frequency_label: form.frequency_label || null,
      last_serviced_date: form.last_serviced_date || null,
      company: form.company || null,
      poc_name: form.poc_name || null,
      poc_phone: form.poc_phone || null,
      email: form.email || null,
      monthly_cost: form.monthly_cost || null,
      account_number: form.account_number || null,
      notes: form.notes || null,
    };

    try {
      const res = await fetch(`/api/maintenance/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string; item?: MaintenanceItem };
      if (!res.ok) {
        throw new Error(data.error ?? "Save failed");
      }
      setSaved(true);
      if (data.item) onSaved?.(data.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const shell = isMobile
    ? "mobile-shell flex min-h-0 flex-1 flex-col overflow-hidden bg-white"
    : "flex flex-1 flex-col overflow-hidden bg-white";

  return (
    <div className={shell}>
      {isMobile ? (
        <header className="shrink-0 border-b border-zinc-200 px-4 py-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-0.5 text-sm font-medium text-[#1a73e8]"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>
        </header>
      ) : null}

      <form
        onSubmit={handleSave}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex items-start gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Wrench className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Recurring maintenance
              </p>
              {!isMobile ? (
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className={cn(inputClass, "mt-1 font-semibold")}
                  required
                />
              ) : (
                <label className="mt-2 block">
                  <span className="text-xs font-medium text-zinc-500">Title</span>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    className={inputClass}
                    required
                  />
                </label>
              )}
            </div>
          </div>

          {error ? (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="mt-3 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
              Saved — all managers will see this update.
            </p>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Next service date">
              <input
                type="date"
                value={form.next_service_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, next_service_date: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Last serviced">
              <input
                type="date"
                value={form.last_serviced_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, last_serviced_date: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="How often" className="sm:col-span-2">
              <input
                value={form.frequency_label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, frequency_label: e.target.value }))
                }
                className={inputClass}
                placeholder="Weekly, Monthly, 3 months…"
              />
            </Field>
          </div>

          <h3 className="mt-6 text-sm font-semibold text-zinc-900">Contact</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Company">
              <input
                value={form.company}
                onChange={(e) =>
                  setForm((f) => ({ ...f, company: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="POC name">
              <input
                value={form.poc_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, poc_name: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="POC phone">
              <input
                type="tel"
                value={form.poc_phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, poc_phone: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Monthly cost">
              <input
                value={form.monthly_cost}
                onChange={(e) =>
                  setForm((f) => ({ ...f, monthly_cost: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Account number">
              <input
                value={form.account_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, account_number: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
          </div>

          <p className="mt-4 text-xs text-zinc-400">
            Last updated {formatIssueDateTime(item.updated_at)}
          </p>
        </div>

        <div className="shrink-0 border-t border-zinc-200 bg-white p-4">
          <button
            type="submit"
            disabled={disabled || saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a73e8] py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  );
}

function formFromItem(item: MaintenanceItem) {
  return {
    title: item.title,
    next_service_date: item.next_service_date ?? "",
    frequency_label: item.frequency_label ?? "",
    last_serviced_date: item.last_serviced_date ?? "",
    company: item.company ?? "",
    poc_name: item.poc_name ?? "",
    poc_phone: item.poc_phone ?? "",
    email: item.email ?? "",
    monthly_cost: item.monthly_cost ?? "",
    account_number: item.account_number ?? "",
    notes: item.notes ?? "",
  };
}
