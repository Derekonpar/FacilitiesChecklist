export interface MaintenanceItem {
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
}

export type MaintenanceUpdatePayload = {
  title?: string;
  next_service_date?: string | null;
  frequency_label?: string | null;
  last_serviced_date?: string | null;
  company?: string | null;
  poc_name?: string | null;
  poc_phone?: string | null;
  email?: string | null;
  monthly_cost?: string | null;
  account_number?: string | null;
  notes?: string | null;
};
