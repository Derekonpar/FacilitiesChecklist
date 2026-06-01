-- Recurring facilities maintenance (imported from maintenance spreadsheet)

create table public.maintenance_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) >= 2),
  next_service_date date,
  frequency_label text,
  last_serviced_date date,
  company text,
  poc_name text,
  poc_phone text,
  email text,
  monthly_cost text,
  account_number text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index maintenance_items_next_service_idx
  on public.maintenance_items (next_service_date);

create trigger maintenance_items_updated_at
  before update on public.maintenance_items
  for each row execute function public.set_updated_at();

alter table public.maintenance_items enable row level security;

create policy "maintenance_select"
  on public.maintenance_items for select
  to anon, authenticated
  using (true);

-- Updates go through Next.js API (service role) after manager PIN check.

alter publication supabase_realtime add table maintenance_items;

comment on table public.maintenance_items is 'Scheduled recurring maintenance vendors and contacts';
