import type { DepartmentId, IssueStatus, PriorityId } from "@/lib/constants";

export type WorkflowStatus = "open" | "on_hold" | "in_progress";

export interface Issue {
  id: string;
  department: DepartmentId;
  comment: string;
  submitted_by: string;
  photo_url?: string;
  priority: PriorityId;
  status: IssueStatus;
  workflow_status: WorkflowStatus;
  created_at: string;
  completed_at?: string | null;
  recalled_at?: string | null;
  completion_note?: string | null;
}

export type IssueView = "list" | "calendar";
export type ListTab = "todo" | "done";
