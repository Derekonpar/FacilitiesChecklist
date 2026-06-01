"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, RotateCcw } from "lucide-react";
import { getDepartmentLabel } from "@/lib/departments";
import { formatIssueDateTime, issueTitle } from "@/lib/format";
import type { Issue } from "@/lib/types/issue";
import type { WorkflowStatus } from "@/lib/types/issue";
import { PriorityDot, StatusSelector } from "./StatusSelector";

type IssueDetailPanelProps = {
  issue: Issue | null;
  disabled?: boolean;
  onWorkflowChange: (id: string, status: WorkflowStatus) => void;
  onComplete: (id: string, note?: string) => void;
  onRecall: (id: string) => void;
};

export function IssueDetailPanel({
  issue,
  disabled,
  onWorkflowChange,
  onComplete,
  onRecall,
}: IssueDetailPanelProps) {
  const [completionNote, setCompletionNote] = useState("");

  if (!issue) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white text-zinc-500">
        Select an issue to view details
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      <div className="border-b border-zinc-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-zinc-900">
          {issueTitle(issue)}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Reported by {issue.submitted_by}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <fieldset disabled={disabled} className="disabled:opacity-60">
          <StatusSelector
            issue={issue}
            onWorkflowChange={(s) => onWorkflowChange(issue.id, s)}
            onComplete={() =>
              onComplete(issue.id, completionNote || undefined)
            }
          />
        </fieldset>

        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Meta label="Reported" value={formatIssueDateTime(issue.created_at)} />
          <Meta label="Department" value={getDepartmentLabel(issue.department)} />
          <Meta
            label="Priority"
            value={<PriorityDot priority={issue.priority} />}
          />
          <Meta label="Issue ID" value={`#${issue.id.slice(0, 8)}`} />
          {issue.completed_at ? (
            <Meta
              label="Completed"
              value={formatIssueDateTime(issue.completed_at)}
            />
          ) : null}
        </dl>

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-zinc-900">Description</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
            {issue.comment}
          </p>
        </section>

        {issue.status === "open" ? (
          <section className="mt-6">
            <label className="text-sm font-semibold text-zinc-900">
              Completion note (optional)
            </label>
            <textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              rows={2}
              placeholder="Add a note when marking Done…"
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
            />
          </section>
        ) : null}

        {issue.completion_note ? (
          <section className="mt-6 rounded-lg bg-zinc-50 p-4">
            <h3 className="text-sm font-semibold text-zinc-900">
              Completion note
            </h3>
            <p className="mt-1 text-sm text-zinc-700">{issue.completion_note}</p>
          </section>
        ) : null}

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-zinc-900">Photos</h3>
          {issue.photo_url ? (
            <div className="relative mt-2 h-48 w-full max-w-md overflow-hidden rounded-lg border border-zinc-200">
              <Image
                src={issue.photo_url}
                alt="Issue photo"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="mt-2 flex h-32 max-w-md items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400">
              <ImageIcon className="mr-2 h-5 w-5" />
              No photo attached
            </div>
          )}
        </section>

        {issue.status === "completed" ? (
          <button
            type="button"
            onClick={() => onRecall(issue.id)}
            className="mt-6 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
          >
            <RotateCcw className="h-4 w-4" />
            Recall to top of queue
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-zinc-900">{value}</dd>
    </div>
  );
}
