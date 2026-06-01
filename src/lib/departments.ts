import { DEPARTMENTS, type DepartmentId } from "@/lib/constants";

export function getDepartmentLabel(id: DepartmentId): string {
  return DEPARTMENTS.find((d) => d.id === id)?.label ?? id;
}

/** Calendar / list accent colors per department */
export const DEPARTMENT_COLORS: Record<DepartmentId, string> = {
  bowling: "#0d9488",
  karaoke: "#7c3aed",
  darts: "#dc2626",
  mini_golf: "#16a34a",
  shuffleboard: "#ca8a04",
  foosball: "#ea580c",
  cleaning: "#64748b",
  beverage: "#2563eb",
  outdoor: "#059669",
  main_wall: "#4f46e5",
  kitchen: "#b45309",
  front_desk: "#0891b2",
  break_room: "#9333ea",
  dock: "#525252",
  bathroom: "#0e7490",
  vip: "#be123c",
};
