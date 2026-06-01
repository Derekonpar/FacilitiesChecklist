export const VENUE_NAME = "On Par Entertainment";

export const DEPARTMENTS = [
  { id: "bowling", label: "Bowling" },
  { id: "karaoke", label: "Karaoke" },
  { id: "darts", label: "Darts" },
  { id: "mini_golf", label: "Mini Golf" },
  { id: "shuffleboard", label: "Shuffleboard" },
  { id: "foosball", label: "Foosball" },
  { id: "cleaning", label: "Cleaning" },
  { id: "beverage", label: "Beverage" },
  { id: "outdoor", label: "Outdoor" },
  { id: "main_wall", label: "Main Wall" },
  { id: "kitchen", label: "Kitchen" },
  { id: "front_desk", label: "Front Desk" },
  { id: "break_room", label: "Break Room" },
  { id: "dock", label: "Dock" },
  { id: "bathroom", label: "Bathroom" },
  { id: "vip", label: "VIP" },
] as const;

export type DepartmentId = (typeof DEPARTMENTS)[number]["id"];

export const PRIORITIES = [
  { id: "normal", label: "Normal" },
  { id: "urgent", label: "Urgent" },
] as const;

export type PriorityId = (typeof PRIORITIES)[number]["id"];

export const ISSUE_STATUSES = ["open", "completed"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

