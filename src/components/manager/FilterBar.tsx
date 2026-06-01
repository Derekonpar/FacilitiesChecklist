"use client";

import { ChevronDown, Filter } from "lucide-react";
import { DEPARTMENTS, PRIORITIES } from "@/lib/constants";
import type { DepartmentId, PriorityId } from "@/lib/constants";
import { cn } from "@/lib/utils";

type FilterBarProps = {
  department: DepartmentId | "all";
  priority: PriorityId | "all";
  onDepartmentChange: (v: DepartmentId | "all") => void;
  onPriorityChange: (v: PriorityId | "all") => void;
};

export function FilterBar({
  department,
  priority,
  onDepartmentChange,
  onPriorityChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-4 py-2">
      <FilterChip
        label="Department"
        value={
          department === "all"
            ? "All"
            : DEPARTMENTS.find((d) => d.id === department)?.label
        }
      >
        <select
          className="absolute inset-0 cursor-pointer opacity-0"
          value={department}
          onChange={(e) =>
            onDepartmentChange(e.target.value as DepartmentId | "all")
          }
        >
          <option value="all">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </FilterChip>

      <FilterChip
        label="Priority"
        value={
          priority === "all"
            ? "All"
            : PRIORITIES.find((p) => p.id === priority)?.label
        }
      >
        <select
          className="absolute inset-0 cursor-pointer opacity-0"
          value={priority}
          onChange={(e) =>
            onPriorityChange(e.target.value as PriorityId | "all")
          }
        >
          <option value="all">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </FilterChip>

      <button
        type="button"
        className="ml-auto flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
      >
        <Filter className="h-4 w-4" />
        My filters
      </button>
    </div>
  );
}

function FilterChip({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50",
      )}
    >
      <span className="text-zinc-500">{label}</span>
      {value ? <span className="font-medium">{value}</span> : null}
      <ChevronDown className="h-4 w-4 text-zinc-400" />
      {children}
    </div>
  );
}
