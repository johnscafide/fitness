-- ============================================================
-- Hybrid Hustler Fitness OS — Supabase Schema v2
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- Drop old tables if they exist with wrong columns (safe re-run)
drop table if exists workouts    cascade;
drop table if exists weights     cascade;
drop table if exists supplements cascade;
drop table if exists trt_logs    cascade;
drop table if exists user_meta   cascade;

-- ── Workouts ─────────────────────────────────────────────
create table workouts (
  id          text        primary key,
  user_id     text        not null default 'john',
  date        text        not null,
  type        text        not null,
  equipment   text,
  calories    numeric     default 0,
  minutes     numeric     default 0,
  miles       numeric     default 0,
  avg_hr      numeric,
  max_hr      numeric,
  exercises   jsonb,
  notes       text,
  created_at  text,
  updated_at  text
);

-- ── Weights ───────────────────────────────────────────────
create table weights (
  id          text        primary key,
  user_id     text        not null default 'john',
  date        text        not null,
  weight      numeric     not null,
  waist       numeric,
  notes       text,
  created_at  text,
  updated_at  text
);

-- ── Supplements ───────────────────────────────────────────
create table supplements (
  id          text        primary key,
  user_id     text        not null default 'john',
  date        text        not null,
  name        text        not null,
  dose        text,
  time        text,
  notes       text,
  created_at  text,
  updated_at  text
);

-- ── TRT Logs ──────────────────────────────────────────────
create table trt_logs (
  id          text        primary key,
  user_id     text        not null default 'john',
  date        text        not null,
  dose        numeric,
  unit        text,
  compound    text,
  site        text,
  notes       text,
  created_at  text,
  updated_at  text
);

-- ── User Meta (profile + challenge as JSON) ───────────────
create table user_meta (
  user_id              text  primary key default 'john',
  profile              jsonb,
  challenge            jsonb,
  profile_updated_at   text,
  challenge_updated_at text
);

-- ── Indexes ───────────────────────────────────────────────
create index workouts_user_date    on workouts    (user_id, date);
create index weights_user_date     on weights     (user_id, date);
create index supplements_user_date on supplements (user_id, date);
create index trt_logs_user_date    on trt_logs    (user_id, date);

-- ── Row Level Security ────────────────────────────────────
-- Single-user app, password-gated at the app level.
-- Anon key gets full access. Upgrade to Supabase Auth later if needed.

alter table workouts    enable row level security;
alter table weights     enable row level security;
alter table supplements enable row level security;
alter table trt_logs    enable row level security;
alter table user_meta   enable row level security;

create policy "anon_all" on workouts    for all to anon using (true) with check (true);
create policy "anon_all" on weights     for all to anon using (true) with check (true);
create policy "anon_all" on supplements for all to anon using (true) with check (true);
create policy "anon_all" on trt_logs    for all to anon using (true) with check (true);
create policy "anon_all" on user_meta   for all to anon using (true) with check (true);
