"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { ArrowLeft, Camera, AlertTriangle, Loader2 } from "lucide-react";
import { DEPARTMENTS, PRIORITIES, VENUE_NAME } from "@/lib/constants";
import type { DepartmentId, PriorityId } from "@/lib/constants";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function SubmitForm() {
  const searchParams = useSearchParams();
  const deptParam = searchParams.get("dept") as DepartmentId | null;
  const validDept = DEPARTMENTS.some((d) => d.id === deptParam)
    ? deptParam!
    : "";

  const fileRef = useRef<HTMLInputElement>(null);
  const [department, setDepartment] = useState<DepartmentId | "">(validDept);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [priority, setPriority] = useState<PriorityId>("normal");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function onPhotoChange(file: File | null) {
    setPhotoFile(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!department || !name.trim() || comment.trim().length < 3) return;

    if (!isSupabaseConfigured()) {
      setError(
        "Database is not connected yet. Ask your admin to add Supabase keys to Vercel.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      let photo_path: string | null = null;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop() ?? "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("issue-photos")
          .upload(path, photoFile, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }
        photo_path = path;
      }

      const { error: insertError } = await supabase.from("issues").insert({
        department,
        comment: comment.trim(),
        submitted_by: name.trim(),
        priority,
        photo_path,
        status: "open",
        workflow_status: "open",
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSubmitted(true);
      setName("");
      setComment("");
      setPriority("normal");
      onPhotoChange(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit issue");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          ✓
        </div>
        <h2 className="mt-4 text-xl font-semibold">Issue submitted</h2>
        <p className="mt-2 text-zinc-600">
          Managers will see it on the dashboard immediately.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 rounded-lg bg-[#1a73e8] px-6 py-3 text-sm font-semibold text-white"
        >
          Submit another
        </button>
        <Link
          href="/lead"
          className="mt-4 block text-sm text-[#1a73e8] hover:underline"
        >
          Open manager dashboard
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg px-4 py-8 pb-24"
    >
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        {VENUE_NAME}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
        Report an issue
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Time is recorded automatically when you submit.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <label className="mt-8 block text-sm font-medium text-zinc-900">
        Your name <span className="text-red-500">*</span>
      </label>
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-zinc-300 px-4 py-3 text-base outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
        placeholder="First name or initials"
      />

      <label className="mt-6 block text-sm font-medium text-zinc-900">
        Department <span className="text-red-500">*</span>
      </label>
      <select
        required
        value={department}
        onChange={(e) => setDepartment(e.target.value as DepartmentId)}
        className="mt-1.5 w-full rounded-lg border border-zinc-300 px-4 py-3 text-base outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
      >
        <option value="" disabled>
          Select department…
        </option>
        {DEPARTMENTS.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </select>

      <label className="mt-6 block text-sm font-medium text-zinc-900">
        Priority
      </label>
      <div className="mt-2 flex gap-2">
        {PRIORITIES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPriority(p.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-3 text-sm font-medium transition",
              priority === p.id
                ? p.id === "urgent"
                  ? "border-red-500 bg-red-50 text-red-800"
                  : "border-[#1a73e8] bg-[#1a73e8]/10 text-[#1a73e8]"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
            )}
          >
            {p.id === "urgent" ? (
              <AlertTriangle className="h-4 w-4" />
            ) : null}
            {p.label}
          </button>
        ))}
      </div>

      <label className="mt-6 block text-sm font-medium text-zinc-900">
        What&apos;s the issue? <span className="text-red-500">*</span>
      </label>
      <textarea
        required
        minLength={3}
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-zinc-300 px-4 py-3 text-base outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
        placeholder="Describe the problem…"
      />

      <label className="mt-6 block text-sm font-medium text-zinc-900">
        Photo (optional)
      </label>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="mt-1.5 flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-8 text-zinc-600 hover:bg-zinc-100"
      >
        {photoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoPreview}
            alt="Preview"
            className="max-h-40 rounded-lg object-contain"
          />
        ) : (
          <>
            <Camera className="h-5 w-5" />
            Take or upload photo
          </>
        )}
      </button>

      <button
        type="submit"
        disabled={submitting}
        className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white p-4 sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0"
      >
        <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a73e8] py-4 text-base font-semibold text-white hover:bg-[#1557b0] disabled:opacity-60">
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Submitting…
            </>
          ) : (
            "Submit issue"
          )}
        </span>
      </button>
    </form>
  );
}

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
        <SubmitForm />
      </Suspense>
    </div>
  );
}
