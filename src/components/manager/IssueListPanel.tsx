"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ImageIcon } from "lucide-react";
import type { DepartmentId } from "@/lib/constants";
import { getDepartmentLabel } from "@/lib/departments";
import {
  formatCategoryOldestDate,
  formatRelativeTime,
  issueTitle,
} from "@/lib/format";
import { groupIssuesByDepartment, isIssueStale } from "@/lib/issues";
import type { Issue } from "@/lib/types/issue";
import type { ListTab } from "@/lib/types/issue";
import { cn } from "@/lib/utils";
import { PriorityDot, StatusBadge } from "./StatusSelector";

type IssueListPanelProps = {
  issues: Issue[];
  tab: ListTab;
  onTabChange: (tab: ListTab) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
};

export function IssueListPanel({
  issues,
  tab,
  onTabChange,
  selectedId,
  onSelect,
  className,
}: IssueListPanelProps) {
  const filtered =
    tab === "todo"
      ? issues.filter((i) => i.status === "open")
      : issues.filter((i) => i.status === "completed");

  const grouped = useMemo(
    () =>
      groupIssuesByDepartment(filtered, {
        bubbleNewestDepartments: tab === "todo",
      }),
    [filtered, tab],
  );

  /** Departments expanded to show issues — starts collapsed; not reset on realtime updates. */
  const [expanded, setExpanded] = useState<Set<DepartmentId>>(() => new Set());

  useEffect(() => {
    setExpanded(new Set());
  }, [tab]);

  useEffect(() => {
    if (!selectedId) return;
    const issue = issues.find((i) => i.id === selectedId);
    if (issue) {
      setExpanded((prev) => {
        if (prev.has(issue.department)) return prev;
        const next = new Set(prev);
        next.add(issue.department);
        return next;
      });
    }
  }, [selectedId, issues]);

  function toggleDepartment(id: DepartmentId) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const todoCount = issues.filter((i) => i.status === "open").length;
  const doneCount = issues.filter((i) => i.status === "completed").length;

  return (
    <div
      className={cn(
        "w-full shrink-0 flex-col border-r border-zinc-200 bg-[#fafafa] lg:w-[340px]",
        className ?? "flex",
      )}
    >
      <div className="flex border-b border-zinc-200 bg-white">
        <TabBtn active={tab === "todo"} onClick={() => onTabChange("todo")}>
          To Do
          {todoCount > 0 ? (
            <span className="ml-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
              {todoCount}
            </span>
          ) : null}
        </TabBtn>
        <TabBtn active={tab === "done"} onClick={() => onTabChange("done")}>
          Done
          {doneCount > 0 ? (
            <span className="ml-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
              {doneCount}
            </span>
          ) : null}
        </TabBtn>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {grouped.length === 0 ? (
          <p className="p-4 text-center text-sm text-zinc-500">
            No issues in this tab.
          </p>
        ) : (
          grouped.map(
            ({
              department,
              label,
              issues: deptIssues,
              oldestCreatedAt,
            }) => {
            const isOpen = expanded.has(department);
            const staleInDept = deptIssues.filter((i) => isIssueStale(i)).length;
            const oldestLabel = formatCategoryOldestDate(oldestCreatedAt);

            return (
              <section key={department} className="mb-2">
                <button
                  type="button"
                  onClick={() => toggleDepartment(department)}
                  className="flex w-full items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-left shadow-sm ring-1 ring-zinc-200/80 transition hover:bg-zinc-50 active:bg-zinc-100"
                  aria-expanded={isOpen}
                  aria-controls={`dept-issues-${department}`}
                >
                  <ChevronDown
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition",
                      isOpen ? "rotate-0" : "-rotate-90",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-zinc-900">
                      {label}
                    </span>
                    {!isOpen ? (
                      <span
                        className={cn(
                          "mt-0.5 block text-xs tabular-nums",
                          staleInDept > 0
                            ? "font-medium text-amber-700"
                            : "text-zinc-500",
                        )}
                      >
                        Oldest: {oldestLabel}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-700">
                      {deptIssues.length}
                    </span>
                    {staleInDept > 0 ? (
                      <span
                        className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800"
                        title="Open more than a week"
                      >
                        {staleInDept} stale
                      </span>
                    ) : null}
                  </div>
                </button>

                {isOpen ? (
                  <div
                    id={`dept-issues-${department}`}
                    className="mt-1 space-y-1 border-l-2 border-zinc-200 pl-2"
                  >
                    {deptIssues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        selected={selectedId === issue.id}
                        stale={isIssueStale(issue)}
                        onSelect={() => onSelect(issue.id)}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            );
          },
          )
        )}
      </div>
    </div>
  );
}

function TabBtn({
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
        "flex flex-1 items-center justify-center gap-0.5 border-b-2 py-3 text-sm font-medium transition",
        active
          ? "border-[#1a73e8] text-[#1a73e8]"
          : "border-transparent text-zinc-500 hover:text-zinc-800",
      )}
    >
      {children}
    </button>
  );
}

function IssueCard({
  issue,
  selected,
  stale,
  onSelect,
}: {
  issue: Issue;
  selected: boolean;
  stale?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full gap-3 rounded-2xl border bg-white p-3.5 text-left shadow-sm transition active:scale-[0.99]",
        selected
          ? "border-[#1a73e8] ring-2 ring-[#1a73e8]/20"
          : stale
            ? "border-amber-300 hover:border-amber-400"
            : "border-zinc-200/80 hover:border-zinc-300",
      )}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
        {issue.photo_url ? (
          <Image
            src={issue.photo_url}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">
          {issueTitle(issue)}
        </p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {getDepartmentLabel(issue.department)} · {issue.submitted_by}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge issue={issue} />
          <PriorityDot priority={issue.priority} />
          {stale ? (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
              7+ days
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          {formatRelativeTime(issue.created_at)}
          {issue.recalled_at ? " · Recalled" : ""}
        </p>
      </div>
    </button>
  );
}
