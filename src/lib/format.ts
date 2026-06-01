import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";

export function formatRelativeTime(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true });
}

export function formatIssueDateTime(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
}

export function issueTitle(issue: { department: string; comment: string }): string {
  const firstLine = issue.comment.split(/[.!?\n]/)[0]?.trim() ?? "Issue";
  return firstLine.length > 56 ? `${firstLine.slice(0, 53)}…` : firstLine;
}
