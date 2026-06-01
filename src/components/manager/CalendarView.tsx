"use client";

import { useMemo, useState } from "react";
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
  const [focusedDay, setFocusedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weekStart = startOfWeek(month, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  function issuesForDay(day: Date) {
    return issues.filter((i) => isSameDay(parseISO(i.created_at), day));
  }

  const displayDay = focusedDay ?? new Date();
  const focusedIssues = issuesForDay(displayDay);

  const monthGridDays = useMemo(() => days, [days]);

  function selectDay(day: Date, firstIssueId?: string) {
    setFocusedDay(day);
    if (firstIssueId) onSelect(firstIssueId);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-zinc-200 px-3 py-3 md:px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start">
            <div className="flex rounded-lg border border-zinc-200 p-0.5">
              <ModeBtn
                active={calendarMode === "month"}
                onClick={() => onCalendarModeChange("month")}
              >
                Month
              </ModeBtn>
              <ModeBtn
                active={calendarMode === "week"}
                onClick={() => onCalendarModeChange("week")}
              >
                Week
              </ModeBtn>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 md:justify-center">
            <button
              type="button"
              onClick={() => onMonthChange(subMonths(month, 1))}
              className="rounded-lg p-2 hover:bg-zinc-100 active:bg-zinc-200"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-center text-base font-semibold md:min-w-[160px] md:text-lg">
              {format(month, "MMMM yyyy")}
            </span>
            <button
              type="button"
              onClick={() => onMonthChange(addMonths(month, 1))}
              className="rounded-lg p-2 hover:bg-zinc-100 active:bg-zinc-200"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: classic grid */}
      <div className="hidden min-h-0 flex-1 flex-col overflow-hidden md:flex">
        <WeekdayHeader />
        <div
          className={cn(
            "grid flex-1 auto-rows-fr grid-cols-7 overflow-auto",
            calendarMode === "week" && "min-h-0",
          )}
        >
          {(calendarMode === "week" ? weekDays : days).map((day) => (
            <DesktopDayCell
              key={day.toISOString()}
              day={day}
              month={month}
              calendarMode={calendarMode}
              issues={issuesForDay(day)}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
        <Legend />
      </div>

      {/* Mobile: legible month or stacked week */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
        {calendarMode === "month" ? (
          <>
            <WeekdayHeader compact />
            <div className="grid shrink-0 grid-cols-7 border-b border-zinc-100 bg-white px-1 py-1">
              {monthGridDays.map((day) => {
                const dayIssues = issuesForDay(day);
                const inMonth = isSameMonth(day, month);
                const today = isSameDay(day, new Date());
                const focused = focusedDay && isSameDay(day, focusedDay);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => selectDay(day, dayIssues[0]?.id)}
                    className={cn(
                      "flex min-h-[52px] flex-col items-center rounded-lg py-1.5 transition",
                      !inMonth && "opacity-40",
                      focused && "bg-[#1a73e8]/10 ring-2 ring-[#1a73e8]",
                      !focused && today && "bg-[#1a73e8] text-white",
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        today && !focused && "text-white",
                        !today && "text-zinc-800",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="mt-1 flex gap-0.5">
                      {dayIssues.slice(0, 3).map((issue) => (
                        <span
                          key={issue.id}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor:
                              DEPARTMENT_COLORS[issue.department],
                          }}
                        />
                      ))}
                    </div>
                    {dayIssues.length > 3 ? (
                      <span className="mt-0.5 text-[10px] text-zinc-500">
                        +{dayIssues.length - 3}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <MobileDayAgenda
              day={displayDay}
              issues={focusedIssues}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {weekDays.map((day) => {
              const dayIssues = issuesForDay(day);
              const today = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3"
                >
                  <p
                    className={cn(
                      "mb-2 text-sm font-semibold",
                      today ? "text-[#1a73e8]" : "text-zinc-800",
                    )}
                  >
                    {format(day, "EEEE, MMM d")}
                    {today ? " · Today" : ""}
                  </p>
                  {dayIssues.length === 0 ? (
                    <p className="text-sm text-zinc-500">No issues</p>
                  ) : (
                    <div className="space-y-2">
                      {dayIssues.map((issue) => (
                        <IssueChip
                          key={issue.id}
                          issue={issue}
                          selected={selectedId === issue.id}
                          onSelect={() => onSelect(issue.id)}
                          large
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ModeBtn({
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
        "rounded-md px-4 py-2 text-sm font-medium",
        active
          ? "bg-[#1a73e8] text-white"
          : "text-zinc-600 hover:bg-zinc-50",
      )}
    >
      {children}
    </button>
  );
}

function WeekdayHeader({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center font-medium uppercase text-zinc-500",
        compact ? "text-[10px]" : "text-xs",
      )}
    >
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
        <div key={d} className={cn(compact ? "py-1.5" : "py-2")}>
          {d}
        </div>
      ))}
    </div>
  );
}

function DesktopDayCell({
  day,
  month,
  calendarMode,
  issues,
  selectedId,
  onSelect,
}: {
  day: Date;
  month: Date;
  calendarMode: "month" | "week";
  issues: Issue[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const inMonth = isSameMonth(day, month);
  const today = isSameDay(day, new Date());
  const max = calendarMode === "week" ? 12 : 3;

  return (
    <div
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
        {issues.slice(0, max).map((issue) => (
          <IssueChip
            key={issue.id}
            issue={issue}
            selected={selectedId === issue.id}
            onSelect={() => onSelect(issue.id)}
          />
        ))}
        {issues.length > max ? (
          <p className="px-1 text-xs text-zinc-500">+{issues.length - max} more</p>
        ) : null}
      </div>
    </div>
  );
}

function MobileDayAgenda({
  day,
  issues,
  selectedId,
  onSelect,
}: {
  day: Date;
  issues: Issue[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-zinc-200 bg-zinc-50">
      <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-zinc-900">
          {format(day, "EEEE, MMMM d")}
        </p>
        <p className="text-xs text-zinc-500">
          {issues.length} issue{issues.length === 1 ? "" : "s"} — tap to open
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {issues.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            No issues this day
          </p>
        ) : (
          <div className="space-y-2">
            {issues.map((issue) => (
              <IssueChip
                key={issue.id}
                issue={issue}
                selected={selectedId === issue.id}
                onSelect={() => onSelect(issue.id)}
                large
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IssueChip({
  issue,
  selected,
  onSelect,
  large,
}: {
  issue: Issue;
  selected: boolean;
  onSelect: () => void;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-0.5 rounded-lg border border-zinc-200 bg-white text-left shadow-sm active:bg-zinc-50",
        large ? "px-3 py-3" : "px-1.5 py-1",
        selected && "ring-2 ring-[#1a73e8]",
      )}
      style={{
        borderLeftWidth: 4,
        borderLeftColor: DEPARTMENT_COLORS[issue.department],
      }}
    >
      <span
        className={cn(
          "font-medium text-zinc-900",
          large ? "text-sm leading-snug" : "line-clamp-2 text-xs",
        )}
      >
        {issueTitle(issue)}
      </span>
      {large ? (
        <span className="text-xs text-zinc-500">
          {getDepartmentLabel(issue.department)} · {issue.submitted_by}
        </span>
      ) : null}
    </button>
  );
}

function Legend() {
  return (
    <div className="hidden border-t border-zinc-200 px-4 py-2 md:block">
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
  );
}
