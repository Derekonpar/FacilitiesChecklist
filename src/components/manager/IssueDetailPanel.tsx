"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ImageIcon, RotateCcw } from "lucide-react";
import { getDepartmentLabel } from "@/lib/departments";
import { formatIssueDateTime, issueTitle } from "@/lib/format";
import type { Issue } from "@/lib/types/issue";
import type { WorkflowStatus } from "@/lib/types/issue";
import { InfoCard } from "@/components/ui/InfoCard";
import { cn } from "@/lib/utils";
import {
  PriorityDot,
  PriorityLabel,
  StatusSelector,
} from "./StatusSelector";

type DetailTab = "details" | "photos";

type IssueDetailPanelProps = {
  issue: Issue | null;
  disabled?: boolean;
  variant?: "desktop" | "mobile";
  onBack?: () => void;
  onWorkflowChange: (id: string, status: WorkflowStatus) => void;
  onComplete: (id: string, note?: string) => void;
  onRecall: (id: string) => void;
};

export function IssueDetailPanel({
  issue,
  disabled,
  variant = "desktop",
  onBack,
  onWorkflowChange,
  onComplete,
  onRecall,
}: IssueDetailPanelProps) {
  const [completionNote, setCompletionNote] = useState("");
  const [tab, setTab] = useState<DetailTab>("details");
  const isMobile = variant === "mobile";

  if (!issue) {
    return (
      <div
        className={cn(
          "flex flex-1 items-center justify-center text-zinc-500",
          isMobile ? "mobile-shell min-h-screen" : "bg-white",
        )}
      >
        Select an issue to view details
      </div>
    );
  }

  const shell = isMobile
    ? "mobile-shell flex min-h-0 flex-1 flex-col overflow-hidden"
    : "flex flex-1 flex-col overflow-hidden bg-white";

  return (
    <div className={shell}>
      {/* Mobile header */}
      {isMobile ? (
        <header className="shrink-0 border-b border-zinc-200/60 bg-white/80 px-4 pb-3 pt-2 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-0.5 text-[#1a73e8] text-sm font-medium"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>
            <span className="text-sm font-medium text-zinc-500">
              #{issue.id.slice(0, 8)}
            </span>
            <div className="w-12" />
          </div>
          <h1 className="mt-3 text-xl font-bold leading-snug tracking-tight text-zinc-900">
            {issueTitle(issue)}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {getDepartmentLabel(issue.department)} · {issue.submitted_by}
          </p>

          <div className="mt-4 flex border-b border-zinc-200">
            <TabButton
              active={tab === "details"}
              onClick={() => setTab("details")}
            >
              Details
            </TabButton>
            <TabButton
              active={tab === "photos"}
              onClick={() => setTab("photos")}
            >
              Photos
            </TabButton>
          </div>
        </header>
      ) : (
        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-zinc-900">
            {issueTitle(issue)}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Reported by {issue.submitted_by}
          </p>
        </div>
      )}

      <div
        className={cn(
          "flex-1 overflow-y-auto",
          isMobile ? "px-4 py-4 pb-8" : "bg-white px-6 py-4",
        )}
      >
        {(tab === "details" || !isMobile) && (
          <>
            <fieldset disabled={disabled} className="disabled:opacity-60">
              <StatusSelector
                issue={issue}
                compact={isMobile}
                onWorkflowChange={(s) => onWorkflowChange(issue.id, s)}
                onComplete={() =>
                  onComplete(issue.id, completionNote || undefined)
                }
              />
            </fieldset>

            <div className={cn("mt-5", isMobile ? "" : "mt-6")}>
              {isMobile ? (
                <InfoCard
                  rows={[
                    {
                      label: "Reported",
                      value: formatIssueDateTime(issue.created_at),
                    },
                    {
                      label: "Department",
                      value: getDepartmentLabel(issue.department),
                    },
                    {
                      label: "Priority",
                      value: <PriorityLabel priority={issue.priority} />,
                    },
                    {
                      label: "Submitted by",
                      value: issue.submitted_by,
                    },
                    ...(issue.completed_at
                      ? [
                          {
                            label: "Completed",
                            value: formatIssueDateTime(issue.completed_at),
                          },
                        ]
                      : []),
                  ]}
                />
              ) : (
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Meta
                    label="Reported"
                    value={formatIssueDateTime(issue.created_at)}
                  />
                  <Meta
                    label="Department"
                    value={getDepartmentLabel(issue.department)}
                  />
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
              )}
            </div>

            <section className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-900">
                Description
              </h3>
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
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-3 text-base outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
                />
              </section>
            ) : null}

            {issue.completion_note ? (
              <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/80">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Completion note
                </h3>
                <p className="mt-1 text-sm text-zinc-700">
                  {issue.completion_note}
                </p>
              </section>
            ) : null}

            {issue.status === "completed" ? (
              <button
                type="button"
                onClick={() => onRecall(issue.id)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-sm font-semibold text-amber-900 active:bg-amber-100"
              >
                <RotateCcw className="h-4 w-4" />
                Recall to top of queue
              </button>
            ) : null}
          </>
        )}

        {(tab === "photos" || !isMobile) && (
          <section
            className={cn(
              "mt-6",
              isMobile && tab === "photos" ? "mt-0" : "",
              isMobile && tab !== "photos" && "hidden",
            )}
          >
            {!isMobile ? (
              <h3 className="text-sm font-semibold text-zinc-900">Photos</h3>
            ) : null}
            {issue.photo_url ? (
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm",
                  isMobile ? "mt-2 aspect-[4/3] w-full" : "mt-2 h-48 max-w-md",
                )}
              >
                <Image
                  src={issue.photo_url}
                  alt="Issue photo"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
            ) : (
              <div className="mt-2 flex aspect-[4/3] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/80 text-zinc-400">
                <ImageIcon className="mb-2 h-10 w-10" />
                <p className="text-sm">No photo attached</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 border-b-2 pb-2.5 text-sm font-semibold transition",
        active
          ? "border-[#1a73e8] text-[#1a73e8]"
          : "border-transparent text-zinc-500",
      )}
    >
      {children}
    </button>
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
