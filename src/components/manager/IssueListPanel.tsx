"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { getDepartmentLabel } from "@/lib/departments";
import { formatRelativeTime, issueTitle } from "@/lib/format";
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
};

export function IssueListPanel({
  issues,
  tab,
  onTabChange,
  selectedId,
  onSelect,
}: IssueListPanelProps) {
  const filtered =
    tab === "todo"
      ? issues.filter((i) => i.status === "open")
      : issues.filter((i) => i.status === "completed");

  return (
    <div className="flex w-[340px] shrink-0 flex-col border-r border-zinc-200 bg-[#fafafa]">
      <div className="flex border-b border-zinc-200 bg-white">
        <TabBtn active={tab === "todo"} onClick={() => onTabChange("todo")}>
          To Do
        </TabBtn>
        <TabBtn active={tab === "done"} onClick={() => onTabChange("done")}>
          Done
        </TabBtn>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-sm text-zinc-500">
            No issues in this tab.
          </p>
        ) : (
          filtered.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              selected={selectedId === issue.id}
              onSelect={() => onSelect(issue.id)}
            />
          ))
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
        "flex-1 border-b-2 py-3 text-sm font-medium transition",
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
  onSelect,
}: {
  issue: Issue;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "mb-2 flex w-full gap-3 rounded-xl border bg-white p-3 text-left transition",
        selected
          ? "border-[#1a73e8] ring-1 ring-[#1a73e8]/30"
          : "border-zinc-200 hover:border-zinc-300",
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
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          {formatRelativeTime(issue.created_at)}
          {issue.recalled_at ? " · Recalled" : ""}
        </p>
      </div>
    </button>
  );
}
