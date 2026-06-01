-- Sign-up: remove broken auth.users trigger; the app creates profiles via /api/auth/complete-signup.

drop trigger if exists on_auth_user_created on auth.users;

-- Daniel (and other core team) auto-admin on sign-up
update public.signup_allowlist
set auto_admin = true
where local_part in (
  'marketing', 'daniel', 'carlos', 'derek', 'events', 'samantha', 'facilities'
);
