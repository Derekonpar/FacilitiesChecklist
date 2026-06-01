"use client";

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DEPARTMENT_COLORS, getDepartmentLabel } from "@/lib/departments";
import { issueTitle } from "@/lib/format";
import type { Issue } from "@/lib/types/issue";
import { cn } from "@/lib/utils";

type CalendarViewProps = {
  issues: Issue[];
  month: Date;
  onMonthChange: (d: Date) => void;
  calendarMode: "month" | "week";
  onCalendarModeChange: (m: "month" | "week") => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function CalendarView({
  issues,
  month,
  onMonthChange,
  calendarMode,
  onCalendarModeChange,
  selectedId,
  onSelect,
}: CalendarViewProps) {
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weekStart = startOfWeek(month, { weekStartsOn: 1 });
  const weekDays =
    calendarMode === "week"
      ? eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })
      : days;

  function issuesForDay(day: Date) {
    return issues.filter((i) => isSameDay(parseISO(i.created_at), day));
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div className="flex rounded-lg border border-zinc-200 p-0.5">
          <button
            type="button"
            onClick={() => onCalendarModeChange("month")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              calendarMode === "month"
                ? "bg-[#1a73e8] text-white"
                : "text-zinc-600 hover:bg-zinc-50",
            )}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => onCalendarModeChange("week")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              calendarMode === "week"
                ? "bg-[#1a73e8] text-white"
                : "text-zinc-600 hover:bg-zinc-50",
            )}
          >
            Week
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMonthChange(subMonths(month, 1))}
            className="rounded-lg p-1 hover:bg-zinc-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[140px] text-center text-lg font-semibold">
            {format(month, "MMMM yyyy")}
          </span>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="rounded-lg p-1 hover:bg-zinc-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="w-[120px]" />
      </div>

      <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center text-xs font-medium uppercase text-zinc-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div
        className={cn(
          "flex-1 overflow-auto",
          calendarMode === "week" ? "grid grid-cols-7" : "grid grid-cols-7 auto-rows-fr",
        )}
      >
        {(calendarMode === "week" ? weekDays : days).map((day) => {
          const dayIssues = issuesForDay(day);
          const inMonth = isSameMonth(day, month);
          const today = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] border-b border-r border-zinc-100 p-1",
                !inMonth && calendarMode === "month" && "bg-zinc-50/80",
                calendarMode === "week" && "min-h-[320px]",
              )}
            >
              <div className="flex justify-end p-1">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-sm",
                    today && "bg-[#1a73e8] font-semibold text-white",
                    !today && "text-zinc-700",
                    !inMonth && !today && "text-zinc-400",
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-1 px-0.5">
                {dayIssues.slice(0, calendarMode === "week" ? 12 : 3).map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => onSelect(issue.id)}
                    className={cn(
                      "flex w-full items-start gap-1 rounded-md border border-zinc-200 bg-white px-1.5 py-1 text-left text-xs shadow-sm hover:border-zinc-300",
                      selectedId === issue.id && "ring-2 ring-[#1a73e8]",
                    )}
                    style={{
                      borderLeftWidth: 3,
                      borderLeftColor: DEPARTMENT_COLORS[issue.department],
                    }}
                  >
                    <span className="line-clamp-2 font-medium text-zinc-800">
                      {issueTitle(issue)}
                    </span>
                  </button>
                ))}
                {dayIssues.length > (calendarMode === "week" ? 12 : 3) ? (
                  <p className="px-1 text-xs text-zinc-500">
                    +{dayIssues.length - (calendarMode === "week" ? 12 : 3)} more
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-zinc-200 px-4 py-2">
        <p className="text-xs text-zinc-500">
          Color strip = department · Click an issue to open details
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(DEPARTMENT_COLORS)
            .slice(0, 8)
            .map(([id, color]) => (
              <span
                key={id}
                className="flex items-center gap-1 text-xs text-zinc-600"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {getDepartmentLabel(id as Issue["department"])}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
