-- Run this in the Supabase SQL editor (or `supabase db push`).

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  rating smallint check (rating between 1 and 5),
  notes text not null default '',
  track_name text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_started on public.sessions (user_id, started_at desc);

create table if not exists public.scripts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  sessions_reviewed integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ai_reviews_user_created on public.ai_reviews (user_id, created_at desc);

alter table public.sessions enable row level security;
alter table public.scripts enable row level security;
alter table public.ai_reviews enable row level security;

create policy "own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own script" on public.scripts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own reviews" on public.ai_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
