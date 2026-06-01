"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Wifi, WifiOff, Loader2 } from "lucide-react";
import type { Issue } from "@/lib/types/issue";
import type { IssueView, ListTab, WorkflowStatus } from "@/lib/types/issue";
import type { DepartmentId, PriorityId } from "@/lib/constants";
import { issueTitle } from "@/lib/format";
import { useIssues } from "@/hooks/useIssues";
import { Sidebar, ViewToggle } from "./Sidebar";
import { FilterBar } from "./FilterBar";
import { IssueListPanel } from "./IssueListPanel";
import { IssueDetailPanel } from "./IssueDetailPanel";
import { CalendarView } from "./CalendarView";

export function ManagerApp() {
  const { issues, loading, error, refetch } = useIssues();
  const [view, setView] = useState<IssueView>("list");
  const [listTab, setListTab] = useState<ListTab>("todo");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<DepartmentId | "all">("all");
  const [priority, setPriority] = useState<PriorityId | "all">("all");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [calendarMode, setCalendarMode] = useState<"month" | "week">("month");
  const [mutating, setMutating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return issues.filter((i) => {
      if (department !== "all" && i.department !== department) return false;
      if (priority !== "all" && i.priority !== priority) return false;
      if (!q) return true;
      return (
        issueTitle(i).toLowerCase().includes(q) ||
        i.comment.toLowerCase().includes(q) ||
        i.submitted_by.toLowerCase().includes(q) ||
        i.id.includes(q) ||
        i.department.includes(q)
      );
    });
  }, [issues, search, department, priority]);

  const selected = filtered.find((i) => i.id === selectedId) ?? null;

  const openCount = issues.filter((i) => i.status === "open").length;

  async function patchIssue(
    id: string,
    body: Record<string, unknown>,
  ): Promise<boolean> {
    setMutating(true);
    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "Update failed");
        return false;
      }
      return true;
    } finally {
      setMutating(false);
    }
  }

  async function handleWorkflowChange(id: string, workflow_status: WorkflowStatus) {
    const ok = await patchIssue(id, { action: "workflow", workflow_status });
    if (ok) setListTab("todo");
  }

  async function handleComplete(id: string, note?: string) {
    const ok = await patchIssue(id, {
      action: "complete",
      completion_note: note,
    });
    if (ok) setListTab("done");
  }

  async function handleRecall(id: string) {
    const ok = await patchIssue(id, { action: "recall" });
    if (ok) {
      setListTab("todo");
      setSelectedId(id);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f5f7]">
      <Sidebar view={view} onViewChange={setView} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-zinc-200 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <ViewToggle view={view} onViewChange={setView} />
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">Issues</h1>
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                {error ? (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-amber-600" />
                    Offline / config error
                  </>
                ) : (
                  <>
                    <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                    Live · {openCount} open
                  </>
                )}
              </p>
            </div>

            <div className="relative ml-auto min-w-[200px] max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                placeholder="Search issues…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1a73e8] focus:bg-white focus:ring-2 focus:ring-[#1a73e8]/20"
              />
            </div>

            <Link
              href="/submit"
              className="flex items-center gap-1.5 rounded-lg bg-[#1a73e8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1557b0]"
            >
              <Plus className="h-4 w-4" />
              New issue
            </Link>
          </div>
        </header>

        {error ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            {error}{" "}
            <button
              type="button"
              onClick={() => refetch()}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        <FilterBar
          department={department}
          priority={priority}
          onDepartmentChange={setDepartment}
          onPriorityChange={setPriority}
        />

        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading issues…
          </div>
        ) : view === "list" ? (
          <div className="flex min-h-0 flex-1">
            <IssueListPanel
              issues={filtered}
              tab={listTab}
              onTabChange={setListTab}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <IssueDetailPanel
              issue={selected}
              disabled={mutating}
              onWorkflowChange={handleWorkflowChange}
              onComplete={handleComplete}
              onRecall={handleRecall}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              <CalendarView
                issues={filtered}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                calendarMode={calendarMode}
                onCalendarModeChange={setCalendarMode}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
            {selected ? (
              <div className="w-[400px] shrink-0 border-l border-zinc-200">
                <IssueDetailPanel
                  issue={selected}
                  disabled={mutating}
                  onWorkflowChange={handleWorkflowChange}
                  onComplete={handleComplete}
                  onRecall={handleRecall}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
