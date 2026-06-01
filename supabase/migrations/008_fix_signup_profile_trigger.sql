-- Fix "Database error saving new user" on sign-up.
-- Auth trigger must run as postgres and be allowed to insert into profiles.

create table if not exists public.signup_allowed_emails (
  email text primary key check (position('@' in email) > 1),
  auto_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.signup_allowed_emails enable row level security;

create or replace function public.is_allowed_onpar_email(email text)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  local_part text;
  domain_part text;
begin
  email := lower(trim(email));
  if email = '' or position('@' in email) = 0 then
    return false;
  end if;

  if exists (
    select 1 from public.signup_allowed_emails s where s.email = email
  ) then
    return true;
  end if;

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

alter function public.is_allowed_onpar_email(text) owner to postgres;

create or replace function public.is_auto_admin_onpar_email(email text)
returns boolean
language plpgsql
security definer
set search_path = public
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

alter function public.is_auto_admin_onpar_email(text) owner to postgres;

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

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
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    updated_at = now();

  return new;
end;
$$;

alter function public.handle_new_user() owner to postgres;

grant usage on schema public to supabase_auth_admin;
grant insert, select on table public.profiles to supabase_auth_admin;
grant select on table public.signup_allowlist to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
