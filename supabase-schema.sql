-- ============================================================
-- Hybrid Hustler Fitness OS — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Workouts
create table if not exists workouts (
  id           text primary key,
  user_id      text not null default 'john',
  date         text not null,
  type         text not null,
  equipment    text,
  calories     numeric default 0,
  minutes      numeric default 0,
  miles        numeric default 0,
  avg_hr       numeric,
  max_hr       numeric,
  exercises    jsonb,
  notes        text,
  created_at   text,
  updated_at   text
);

-- Weights
create table if not exists weights (
  id           text primary key,
  user_id      text not null default 'john',
  date         text not null,
  weight       numeric not null,
  waist        numeric,
  notes        text,
  created_at   text,
  updated_at   text
);

-- Supplements
create table if not exists supplements (
  id           text primary key,
  user_id      text not null default 'john',
  date         text not null,
  name         text not null,
  dose         text,
  time         text,
  notes        text,
  created_at   text,
  updated_at   text
);

-- TRT Logs
create table if not exists trt_logs (
  id           text primary key,
  user_id      text not null default 'john',
  date         text not null,
  dose         numeric,
  unit         text,
  compound     text,
  site         text,
  notes        text,
  created_at   text,
  updated_at   text
);

-- User Meta (profile + challenge stored as JSON blobs)
create table if not exists user_meta (
  user_id              text primary key default 'john',
  profile              jsonb,
  challenge            jsonb,
  profile_updated_at   text,
  challenge_updated_at text
);

-- ── Indexes for faster queries ────────────────────────────
create index if not exists workouts_user_date    on workouts    (user_id, date);
create index if not exists weights_user_date     on weights     (user_id, date);
create index if not exists supplements_user_date on supplements (user_id, date);
create index if not exists trt_logs_user_date    on trt_logs    (user_id, date);

-- ── Row Level Security ────────────────────────────────────
-- Since this app uses the anon key with no auth, we allow all operations
-- from the anon role. This is fine because the app is password-gated
-- and the data is personal/non-sensitive enough for this threat model.
-- If you want real security later, add Supabase Auth.

alter table workouts    enable row level security;
alter table weights     enable row level security;
alter table supplements enable row level security;
alter table trt_logs    enable row level security;
alter table user_meta   enable row level security;

-- Allow anon full access (single-user app, password-gated at app level)
create policy "anon_all_workouts"    on workouts    for all to anon using (true) with check (true);
create policy "anon_all_weights"     on weights     for all to anon using (true) with check (true);
create policy "anon_all_supplements" on supplements for all to anon using (true) with check (true);
create policy "anon_all_trt_logs"    on trt_logs    for all to anon using (true) with check (true);
create policy "anon_all_user_meta"   on user_meta   for all to anon using (true) with check (true);
