-- Run after 001_issues.sql in Supabase SQL Editor

-- Everyone with the app can read issues (manager dashboard + realtime)
create policy "public_select_issues"
  on public.issues for select
  to anon, authenticated
  using (true);

-- Realtime: new/updated issues appear on dashboard immediately
alter publication supabase_realtime add table public.issues;

-- Photo storage
insert into storage.buckets (id, name, public)
values ('issue-photos', 'issue-photos', true)
on conflict (id) do update set public = true;

create policy "issue_photos_select"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'issue-photos');

create policy "issue_photos_insert"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'issue-photos');
