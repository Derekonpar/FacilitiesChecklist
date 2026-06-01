import type { MaintenanceItem } from "@/lib/types/maintenance";

export type MaintenanceRow = {
  id: string;
  title: string;
  next_service_date: string | null;
  frequency_label: string | null;
  last_serviced_date: string | null;
  company: string | null;
  poc_name: string | null;
  poc_phone: string | null;
  email: string | null;
  monthly_cost: string | null;
  account_number: string | null;
  notes: string | null;
  sort_order: number;
  updated_at: string;
};

export function rowToMaintenance(row: MaintenanceRow): MaintenanceItem {
  return {
    id: row.id,
    title: row.title,
    next_service_date: row.next_service_date,
    frequency_label: row.frequency_label,
    last_serviced_date: row.last_serviced_date,
    company: row.company,
    poc_name: row.poc_name,
    poc_phone: row.poc_phone,
    email: row.email,
    monthly_cost: row.monthly_cost,
    account_number: row.account_number,
    notes: row.notes,
    sort_order: row.sort_order,
    updated_at: row.updated_at,
  };
}

export function sortMaintenance(items: MaintenanceItem[]): MaintenanceItem[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}
