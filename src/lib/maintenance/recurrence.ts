import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";
import type { MaintenanceItem } from "@/lib/types/maintenance";

export type RecurrenceType =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual"
  | "none";

export function parseRecurrenceType(
  frequencyLabel: string | null | undefined,
): RecurrenceType {
  if (!frequencyLabel?.trim()) return "none";
  const l = frequencyLabel.toLowerCase();
  if (l.includes("week")) return "weekly";
  if (l.includes("annual") || l.includes("year")) return "annual";
  if (l.includes("12 month")) return "annual";
  if (
    l.includes("3 month") ||
    l.startsWith("3 ") ||
    l.includes("quarter")
  ) {
    return "quarterly";
  }
  if (l.includes("month")) return "monthly";
  return "none";
}

function stepForward(date: Date, type: RecurrenceType): Date {
  switch (type) {
    case "weekly":
      return addWeeks(date, 1);
    case "monthly":
      return addMonths(date, 1);
    case "quarterly":
      return addMonths(date, 3);
    case "annual":
      return addYears(date, 1);
    default:
      return addDays(date, 1);
  }
}

function anchorDate(item: MaintenanceItem): Date | null {
  if (item.next_service_date) return startOfDay(parseISO(item.next_service_date));
  if (item.last_serviced_date) return startOfDay(parseISO(item.last_serviced_date));
  return null;
}

/** All calendar days in [rangeStart, rangeEnd] when this maintenance is due. */
export function getMaintenanceOccurrencesInRange(
  item: MaintenanceItem,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const anchor = anchorDate(item);
  if (!anchor) return [];

  const start = startOfDay(rangeStart);
  const end = startOfDay(rangeEnd);
  const type = parseRecurrenceType(item.frequency_label);

  if (type === "none") {
    return anchor >= start && anchor <= end ? [anchor] : [];
  }

  const results: Date[] = [];
  let d = anchor;
  let guard = 0;
  while (d < start && guard < 600) {
    d = stepForward(d, type);
    guard++;
  }
  guard = 0;
  while (d <= end && guard < 600) {
    if (d >= start) results.push(d);
    d = stepForward(d, type);
    guard++;
  }
  return results;
}

export function maintenanceOccursOnDay(
  item: MaintenanceItem,
  day: Date,
): boolean {
  const dayStart = startOfDay(day);
  return getMaintenanceOccurrencesInRange(item, dayStart, dayStart).some(
    (d) => isSameDay(d, dayStart),
  );
}
