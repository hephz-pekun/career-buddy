-- ─────────────────────────────────────────────────────────────────────────────
-- Career Buddy — Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable Row Level Security on all tables
-- Users can only read/write their own data

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid references auth.users on delete cascade primary key,
  name        text not null,
  email       text not null,
  school      text,
  major       text,
  location    text default 'anywhere',
  fields      text[] default '{}',
  job_types   text[] default '{}',
  wants_scholarships boolean default true,
  skills      text[] default '{}',
  resume_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table profiles enable row level security;

create policy "users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "users can update own profile"
  on profiles for update using (auth.uid() = id);

-- ── Mood entries ──────────────────────────────────────────────────────────────
create table if not exists mood_entries (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references profiles(id) on delete cascade not null,
  mood       text not null check (mood in ('motivated','okay','overwhelmed','tired','stressed','hopeful')),
  note       text,
  date       date not null,
  created_at timestamptz default now(),
  unique(user_id, date) -- one check-in per day
);

alter table mood_entries enable row level security;

create policy "users can manage own mood entries"
  on mood_entries for all using (auth.uid() = user_id);

-- ── Job applications ──────────────────────────────────────────────────────────
create table if not exists job_applications (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references profiles(id) on delete cascade not null,
  role            text not null,
  company         text not null,
  status          text not null default 'applied'
                    check (status in ('applied','interview','offer','rejected')),
  interview_date  date,
  interview_time  time,
  notes           text,
  job_match_id    text, -- reference to AI/live match id (stored in app)
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table job_applications enable row level security;

create policy "users can manage own job applications"
  on job_applications for all using (auth.uid() = user_id);

-- ── Scholarship applications ──────────────────────────────────────────────────
create table if not exists scholarship_applications (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references profiles(id) on delete cascade not null,
  name       text not null,
  org        text,
  deadline   date,
  amount     text,
  status     text not null default 'pending'
               check (status in ('pending','submitted','awarded','rejected')),
  notes      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table scholarship_applications enable row level security;

create policy "users can manage own scholarship applications"
  on scholarship_applications for all using (auth.uid() = user_id);

-- ── Prep sessions ─────────────────────────────────────────────────────────────
create table if not exists prep_sessions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  question    text not null,
  answer      text not null,
  ai_feedback text,
  mood        text check (mood in ('pumped','nervous','tired','blank')),
  created_at  timestamptz default now()
);

alter table prep_sessions enable row level security;

create policy "users can manage own prep sessions"
  on prep_sessions for all using (auth.uid() = user_id);

-- ── Storage bucket for resumes ────────────────────────────────────────────────
-- Run this separately in the Storage section of Supabase dashboard:
-- 1. Create a bucket called "resumes"
-- 2. Set it to private (not public)
-- 3. Add this RLS policy:
--    Users can upload/read their own resume: storage.foldername(name)[1] = auth.uid()::text

-- ── Triggers for updated_at ───────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger job_apps_updated_at
  before update on job_applications
  for each row execute function update_updated_at();

create trigger schol_apps_updated_at
  before update on scholarship_applications
  for each row execute function update_updated_at();