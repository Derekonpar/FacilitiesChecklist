import { DEPARTMENTS, type DepartmentId } from "@/lib/constants";
import type { Issue } from "@/lib/types/issue";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Open issues older than `days` (default 7). */
export function isIssueStale(issue: Issue, days = 7): boolean {
  if (issue.status !== "open") return false;
  const age = Date.now() - new Date(issue.created_at).getTime();
  return age > days * MS_PER_DAY;
}

export function countStaleIssues(issues: Issue[], days = 7): number {
  return issues.filter((i) => isIssueStale(i, days)).length;
}

export type IssuesByDepartment = {
  department: DepartmentId;
  label: string;
  issues: Issue[];
};

/** Groups issues by department in venue order; only departments with issues. */
export function groupIssuesByDepartment(issues: Issue[]): IssuesByDepartment[] {
  const map = new Map<DepartmentId, Issue[]>();
  for (const issue of issues) {
    const list = map.get(issue.department) ?? [];
    list.push(issue);
    map.set(issue.department, list);
  }

  return DEPARTMENTS.filter((d) => map.has(d.id)).map((d) => ({
    department: d.id,
    label: d.label,
    issues: (map.get(d.id) ?? []).sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    ),
  }));
}
