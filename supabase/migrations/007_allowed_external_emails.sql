-- Allow specific full email addresses (non-@onparbar.com) and brooke@onparbar.com

create table if not exists public.signup_allowed_emails (
  email text primary key check (position('@' in email) > 1),
  auto_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.signup_allowed_emails enable row level security;

drop policy if exists "signup_allowed_emails_select_managers" on public.signup_allowed_emails;
create policy "signup_allowed_emails_select_managers"
  on public.signup_allowed_emails for select
  to authenticated
  using (public.is_profile_admin());

insert into public.signup_allowlist (local_part, auto_admin) values
  ('brooke', false)
on conflict (local_part) do nothing;

insert into public.signup_allowed_emails (email, auto_admin) values
  ('taylorhouseman20@gmail.com', false)
on conflict (email) do nothing;

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
