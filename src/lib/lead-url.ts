import type { IssueView, ListTab } from "@/lib/types/issue";

export type LeadUrlState = {
  view: IssueView;
  tab: ListTab;
  issueId: string | null;
  maintenanceId: string | null;
};

export function parseLeadSearchParams(
  searchParams: URLSearchParams,
): LeadUrlState {
  return {
    view: searchParams.get("view") === "calendar" ? "calendar" : "list",
    tab: searchParams.get("tab") === "done" ? "done" : "todo",
    issueId: searchParams.get("issue"),
    maintenanceId: searchParams.get("maintenance"),
  };
}

export function buildLeadHref(
  pathname: string,
  state: LeadUrlState,
): string {
  const params = new URLSearchParams();
  if (state.view === "calendar") params.set("view", "calendar");
  if (state.tab === "done") params.set("tab", "done");
  if (state.issueId) params.set("issue", state.issueId);
  if (state.maintenanceId) params.set("maintenance", state.maintenanceId);
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}
