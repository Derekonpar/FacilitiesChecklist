-- Team accounts: email allowlist @onparbar.com, roles granted by admins

create type public.user_role as enum ('pending', 'staff', 'manager', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  username text not null unique,
  display_name text,
  role public.user_role not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_username_idx on public.profiles (username);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Users read their own profile
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Managers/admins read all profiles (team list)
create policy "profiles_select_managers"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'admin')
    )
  );

-- Only admins update roles (client uses service API; policy for direct updates)
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

alter publication supabase_realtime add table profiles;

-- Allowed local-parts @onparbar.com (must match src/lib/auth/allowlist.ts)
create or replace function public.is_allowed_onpar_email(email text)
returns boolean
language plpgsql
immutable
as $$
declare
  local_part text;
  domain_part text;
begin
  email := lower(trim(email));
  local_part := split_part(email, '@', 1);
  domain_part := split_part(email, '@', 2);
  if domain_part <> 'onparbar.com' then
    return false;
  end if;
  return local_part in (
    'marketing', 'daniel', 'carlos', 'derek', 'events', 'samantha', 'facilities'
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
  initial_role := case
    when local_part = 'derek' then 'admin'::public.user_role
    else 'pending'::public.user_role
  end;

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on table public.profiles is 'On Par team accounts; manager/admin roles set by admins';
