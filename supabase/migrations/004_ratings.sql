-- ── Migration 004: Ratings system ────────────────────────────────────────────
-- Run in: Supabase Dashboard → SQL Editor

-- Table
create table if not exists public.ratings (
  id         uuid        primary key default gen_random_uuid(),
  match_id   uuid        not null references public.matches(id) on delete cascade,
  rater_id   uuid        not null references public.profiles(id) on delete cascade,
  rated_id   uuid        not null references public.profiles(id) on delete cascade,
  stars      smallint    not null check (stars >= 1 and stars <= 5),
  comment    text        check (char_length(comment) <= 200),
  created_at timestamptz not null default now(),
  constraint one_rating_per_match_per_rater unique (match_id, rater_id)
);

-- RLS
alter table public.ratings enable row level security;
create policy "Anyone reads ratings" on public.ratings for select using (true);
create policy "Rater inserts rating" on public.ratings for insert with check (auth.uid() = rater_id);

-- Columns on profiles
alter table public.profiles
  add column if not exists rating_avg   numeric(3,2) default null,
  add column if not exists rating_count int          not null default 0;

-- Trigger: recalculate avg whenever a rating is inserted
create or replace function public.update_profile_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set
    rating_avg   = (select round(avg(stars)::numeric, 2) from public.ratings where rated_id = NEW.rated_id),
    rating_count = (select count(*) from public.ratings where rated_id = NEW.rated_id)
  where id = NEW.rated_id;
  return NEW;
end;
$$;

create trigger on_rating_inserted
  after insert on public.ratings
  for each row execute procedure public.update_profile_rating();
