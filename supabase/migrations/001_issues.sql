-- On Par Entertainment — facilities issues
-- Run in Supabase SQL Editor or via CLI

create type issue_priority as enum ('normal', 'urgent');
create type issue_status as enum ('open', 'completed');
create type workflow_status as enum ('open', 'on_hold', 'in_progress');

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  comment text not null check (char_length(trim(comment)) >= 3),
  submitted_by text not null check (char_length(trim(submitted_by)) >= 1),
  photo_path text,
  priority issue_priority not null default 'normal',
  status issue_status not null default 'open',
  workflow_status workflow_status not null default 'open',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  completion_note text,
  completion_photo_path text,
  recalled_at timestamptz,
  updated_at timestamptz not null default now()
);

create index issues_status_open_idx on public.issues (status, recalled_at desc nulls last, priority, created_at)
  where status = 'open';

create index issues_status_completed_idx on public.issues (status, completed_at desc)
  where status = 'completed';

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger issues_updated_at
  before update on public.issues
  for each row execute function public.set_updated_at();

alter table public.issues enable row level security;

-- Staff: insert open issues only (anon key + validated fields)
create policy "staff_insert_issues"
  on public.issues for insert
  to anon, authenticated
  with check (
    status = 'open'
    and completed_at is null
    and recalled_at is null
  );

-- Managers: full access via authenticated role (configure after Supabase Auth)
-- For MVP, lead routes use service role in Server Actions; tighten RLS in Phase 2.

comment on table public.issues is 'Facilities requests from floor staff; managed by On Par managers';
