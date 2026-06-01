"use client";

import {
  Check,
  CirclePause,
  Lock,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Issue } from "@/lib/types/issue";
import type { WorkflowStatus } from "@/lib/types/issue";

const STATUSES: {
  id: WorkflowStatus | "done";
  label: string;
  shortLabel: string;
  icon: typeof Lock;
  activeClass: string;
}[] = [
  {
    id: "open",
    label: "Open",
    shortLabel: "Open",
    icon: Lock,
    activeClass: "border-sky-500 text-sky-600 bg-sky-50/50",
  },
  {
    id: "on_hold",
    label: "On hold",
    shortLabel: "On hold",
    icon: CirclePause,
    activeClass: "border-amber-500 text-amber-700 bg-amber-50/50",
  },
  {
    id: "in_progress",
    label: "In progress",
    shortLabel: "In progress",
    icon: RefreshCw,
    activeClass: "border-[#1a73e8] text-[#1a73e8] bg-[#1a73e8]/5",
  },
  {
    id: "done",
    label: "Done",
    shortLabel: "Done",
    icon: Check,
    activeClass: "border-teal-500 text-teal-600 bg-teal-50/50",
  },
];

type StatusSelectorProps = {
  issue: Issue;
  onWorkflowChange: (status: WorkflowStatus) => void;
  onComplete: () => void;
  compact?: boolean;
};

export function StatusSelector({
  issue,
  onWorkflowChange,
  onComplete,
  compact = false,
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
    <div>
      <p className="mb-2 text-xs text-zinc-500">
        Status <span className="text-zinc-400">(tap to update)</span>
      </p>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {STATUSES.map((s) => {
          const Icon = s.icon;
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleClick(s.id)}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border-2 bg-white transition active:scale-[0.97]",
                compact ? "min-h-[72px] px-1 py-2.5" : "min-h-[80px] px-2 py-3",
                isActive
                  ? s.activeClass
                  : "border-zinc-200 text-zinc-700 hover:border-zinc-300",
              )}
            >
              <Icon
                className={cn("mb-1.5", compact ? "h-5 w-5" : "h-6 w-6")}
                strokeWidth={1.75}
              />
              <span
                className={cn(
                  "text-center font-medium leading-tight",
                  compact ? "text-[10px]" : "text-xs",
                )}
              >
                {compact ? s.shortLabel : s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StatusBadge({ issue }: { issue: Issue }) {
  if (issue.status === "completed") {
    return (
      <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800">
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

export function PriorityLabel({ priority }: { priority: Issue["priority"] }) {
  const urgent = priority === "urgent";
  return (
    <span className={cn("font-medium", urgent ? "text-red-600" : "text-zinc-700")}>
      {urgent ? "High" : "Normal"}
    </span>
  );
}
