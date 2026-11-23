-- FieldPour Logger schema. Paste into the Supabase SQL editor.

create table if not exists public.pour_logs (
  id uuid primary key default gen_random_uuid(),
  ticket_no text not null,
  mix_design text not null,
  cubic_yards numeric(6,2) not null default 10,
  slump_in numeric(4,2) not null,
  temp_f numeric(5,1) not null,
  cylinders smallint not null default 0,
  status text not null check (status in ('PASS','REJECT')),
  photo_url text,
  notes text default '',
  project_name text,
  created_at timestamptz not null default now()
);

create index if not exists pour_logs_created_at_idx on public.pour_logs (created_at desc);

alter table public.pour_logs enable row level security;

-- Newer Supabase projects don't auto-grant new public tables to the API roles.
-- Without this, requests fail with 42501 "permission denied" before RLS is checked.
grant select, insert, update on public.pour_logs to anon, authenticated;

-- Demo policies (anon key full access). Tighten with auth for production.
-- UPDATE is required because the app syncs with upsert (retries hit existing rows).
-- Policies are dropped first so this script is safe to re-run.
drop policy if exists "anon read pour_logs"   on public.pour_logs;
drop policy if exists "anon insert pour_logs" on public.pour_logs;
drop policy if exists "anon update pour_logs" on public.pour_logs;
create policy "anon read pour_logs"   on public.pour_logs for select using (true);
create policy "anon insert pour_logs" on public.pour_logs for insert with check (true);
create policy "anon update pour_logs" on public.pour_logs for update using (true) with check (true);

-- Storage bucket for delivery ticket photos
insert into storage.buckets (id, name, public)
values ('tickets', 'tickets', true)
on conflict (id) do nothing;

-- UPDATE is required because photo uploads use upsert: true.
drop policy if exists "tickets public read"  on storage.objects;
drop policy if exists "tickets anon upload"  on storage.objects;
drop policy if exists "tickets anon update"  on storage.objects;
create policy "tickets public read"  on storage.objects for select using (bucket_id = 'tickets');
create policy "tickets anon upload"  on storage.objects for insert with check (bucket_id = 'tickets');
create policy "tickets anon update"  on storage.objects for update using (bucket_id = 'tickets') with check (bucket_id = 'tickets');
