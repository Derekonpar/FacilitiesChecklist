-- Fix "infinite recursion detected in policy for relation profiles"
-- Manager/admin policies must not SELECT from profiles under RLS.

create or replace function public.is_profile_manager_or_admin(user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role in ('manager', 'admin')
  );
$$;

create or replace function public.is_profile_admin(user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
$$;

drop policy if exists "profiles_select_managers" on public.profiles;
create policy "profiles_select_managers"
  on public.profiles for select
  to authenticated
  using (public.is_profile_manager_or_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_profile_admin())
  with check (public.is_profile_admin());

do $$
begin
  if exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'signup_allowlist'
  ) then
    drop policy if exists "signup_allowlist_select_managers" on public.signup_allowlist;
    create policy "signup_allowlist_select_managers"
      on public.signup_allowlist for select
      to authenticated
      using (public.is_profile_admin());
  end if;
end $$;
