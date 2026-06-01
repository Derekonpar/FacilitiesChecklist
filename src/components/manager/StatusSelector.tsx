"use client";

import { cn } from "@/lib/utils";
import type { Issue } from "@/lib/types/issue";
import type { WorkflowStatus } from "@/lib/types/issue";

const STATUSES: { id: WorkflowStatus | "done"; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "on_hold", label: "On Hold" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

type StatusSelectorProps = {
  issue: Issue;
  onWorkflowChange: (status: WorkflowStatus) => void;
  onComplete: () => void;
};

export function StatusSelector({
  issue,
  onWorkflowChange,
  onComplete,
}: StatusSelectorProps) {
  const active =
    issue.status === "completed" ? "done" : issue.workflow_status;

  function handleClick(id: WorkflowStatus | "done") {
    if (id === "done") {
      onComplete();
      return;
    }
    onWorkflowChange(id);
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {STATUSES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => handleClick(s.id)}
          className={cn(
            "rounded-lg border px-2 py-2.5 text-center text-sm font-medium transition",
            active === s.id
              ? "border-[#1a73e8] bg-[#1a73e8] text-white"
              : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ issue }: { issue: Issue }) {
  if (issue.status === "completed") {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
        Done
      </span>
    );
  }
  const map: Record<WorkflowStatus, { label: string; className: string }> = {
    open: { label: "Open", className: "bg-sky-100 text-sky-800" },
    on_hold: { label: "On Hold", className: "bg-amber-100 text-amber-800" },
    in_progress: {
      label: "In Progress",
      className: "bg-[#1a73e8]/15 text-[#1a73e8]",
    },
  };
  const s = map[issue.workflow_status];
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium",
        s.className,
      )}
    >
      {s.label}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: Issue["priority"] }) {
  const urgent = priority === "urgent";
  return (
    <span className="flex items-center gap-1.5 text-xs text-zinc-600">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          urgent ? "bg-red-500" : "bg-emerald-500",
        )}
      />
      {urgent ? "Urgent" : "Normal"}
    </span>
  );
}
