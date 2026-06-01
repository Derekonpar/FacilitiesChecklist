"use client";

import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  LayoutGrid,
  Plus,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IssueView } from "@/lib/types/issue";

type SidebarProps = {
  view: IssueView;
  onViewChange: (view: IssueView) => void;
};

export function Sidebar({ view, onViewChange }: SidebarProps) {
  return (
    <aside className="hidden w-14 shrink-0 flex-col items-center border-r border-zinc-200 bg-white py-3 lg:flex">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a73e8] text-xs font-bold text-white">
        OP
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1">
        <SidebarBtn
          active={view === "list"}
          label="List"
          onClick={() => onViewChange("list")}
        >
          <ClipboardList className="h-5 w-5" />
        </SidebarBtn>
        <SidebarBtn
          active={view === "calendar"}
          label="Calendar"
          onClick={() => onViewChange("calendar")}
        >
          <CalendarDays className="h-5 w-5" />
        </SidebarBtn>
        <Link
          href="/submit"
          className="mt-2 flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
          title="New issue (staff)"
        >
          <Plus className="h-5 w-5" />
        </Link>
      </nav>

      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100"
        title="Settings (coming soon)"
        disabled
      >
        <Settings className="h-5 w-5" />
      </button>
      <div className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
        M
      </div>
    </aside>
  );
}

function SidebarBtn({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg transition",
        active
          ? "bg-[#1a73e8]/10 text-[#1a73e8]"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800",
      )}
    >
      {children}
    </button>
  );
}

export function ViewToggle({
  view,
  onViewChange,
}: {
  view: IssueView;
  onViewChange: (v: IssueView) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
      <button
        type="button"
        onClick={() => onViewChange("list")}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          view === "list" ? "bg-white text-[#1a73e8] shadow-sm" : "text-zinc-500",
        )}
        title="List view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onViewChange("calendar")}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          view === "calendar"
            ? "bg-white text-[#1a73e8] shadow-sm"
            : "text-zinc-500",
        )}
        title="Calendar view"
      >
        <CalendarDays className="h-4 w-4" />
      </button>
    </div>
  );
}
