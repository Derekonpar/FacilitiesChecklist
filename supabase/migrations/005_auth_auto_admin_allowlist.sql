-- Auto-admin for core team emails; optional signup_allowlist for future addresses

create table if not exists public.signup_allowlist (
  local_part text primary key check (char_length(local_part) >= 2),
  auto_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.signup_allowlist enable row level security;

create policy "signup_allowlist_select_managers"
  on public.signup_allowlist for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Core team: admin on sign-up
insert into public.signup_allowlist (local_part, auto_admin) values
  ('marketing', true),
  ('daniel', true),
  ('carlos', true),
  ('derek', true),
  ('events', true),
  ('samantha', true),
  ('facilities', true)
on conflict (local_part) do update set auto_admin = excluded.auto_admin;

create or replace function public.is_allowed_onpar_email(email text)
returns boolean
language plpgsql
stable
as $$
declare
  local_part text;
  domain_part text;
begin
  email := lower(trim(email));
  local_part := split_part(email, '@', 1);
  domain_part := split_part(email, '@', 2);
  if domain_part <> 'onparbar.com' or local_part = '' then
    return false;
  end if;
  return exists (
    select 1 from public.signup_allowlist s where s.local_part = local_part
  );
end;
$$;

create or replace function public.is_auto_admin_onpar_email(email text)
returns boolean
language plpgsql
stable
as $$
declare
  local_part text;
begin
  local_part := split_part(lower(trim(email)), '@', 1);
  return exists (
    select 1 from public.signup_allowlist s
    where s.local_part = local_part and s.auto_admin = true
  );
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  local_part text;
  initial_role public.user_role;
begin
  if not public.is_allowed_onpar_email(new.email) then
    raise exception 'This email is not authorized to create an account';
  end if;

  local_part := split_part(lower(trim(new.email)), '@', 1);

  if public.is_auto_admin_onpar_email(new.email) then
    initial_role := 'admin'::public.user_role;
  else
    initial_role := 'pending'::public.user_role;
  end if;

  insert into public.profiles (id, email, username, display_name, role)
  values (
    new.id,
    lower(trim(new.email)),
    local_part,
    coalesce(new.raw_user_meta_data->>'display_name', initcap(local_part)),
    initial_role
  );

  return new;
end;
$$;

-- Promote existing core-team accounts to admin
update public.profiles p
set role = 'admin'
from public.signup_allowlist s
where p.username = s.local_part
  and s.auto_admin = true
  and p.role is distinct from 'admin';
