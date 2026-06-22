-- ══════════════════════════════════════════════════════════
-- BoleterasCO — Database Schema
-- Pega este SQL en: supabase.com → tu proyecto → SQL Editor → Run
-- ══════════════════════════════════════════════════════════

-- ── Profiles (extends auth.users) ──────────────────────────
create table if not exists public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  full_name     text        not null default '',
  phone         text,
  whatsapp      text,
  cedula        text,
  verified_level smallint   not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Events ─────────────────────────────────────────────────
create table if not exists public.events (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  artist      text,
  date        date        not null,
  venue       text,
  city        text        not null,
  category    text        not null,
  visual      text,
  is_active   boolean     not null default true,
  is_featured boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- ── Listings (sellers) ─────────────────────────────────────
create table if not exists public.listings (
  id             uuid      primary key default gen_random_uuid(),
  user_id        uuid      not null references public.profiles(id) on delete cascade,
  event_id       uuid      not null references public.events(id) on delete cascade,
  section        text      not null,
  quantity       smallint  not null default 1 check (quantity >= 1 and quantity <= 10),
  price_cop      bigint    not null check (price_cop >= 50000),
  notes          text,
  contact_phone  text,
  contact_method text      not null default 'BOTH',
  status         text      not null default 'ACTIVE'
                           check (status in ('ACTIVE','MATCHED','SOLD','CANCELLED')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── Requests (buyers) ──────────────────────────────────────
create table if not exists public.requests (
  id            uuid      primary key default gen_random_uuid(),
  user_id       uuid      not null references public.profiles(id) on delete cascade,
  event_id      uuid      not null references public.events(id) on delete cascade,
  section       text,
  quantity      smallint  not null default 1 check (quantity >= 1 and quantity <= 10),
  max_price_cop bigint    not null check (max_price_cop >= 0),
  whatsapp      text      not null,
  notes         text,
  status        text      not null default 'OPEN'
                          check (status in ('OPEN','MATCHED','FULFILLED','EXPIRED','CANCELLED')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Matches ────────────────────────────────────────────────
create table if not exists public.matches (
  id          uuid      primary key default gen_random_uuid(),
  listing_id  uuid      not null references public.listings(id) on delete cascade,
  request_id  uuid      not null references public.requests(id) on delete cascade,
  status      text      not null default 'PENDING'
                        check (status in ('PENDING','ACCEPTED','REJECTED','EXPIRED')),
  expires_at  timestamptz not null default (now() + interval '24 hours'),
  notified_at timestamptz,
  created_at  timestamptz not null default now()
);

-- ── Row Level Security ─────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.events   enable row level security;
alter table public.listings enable row level security;
alter table public.requests enable row level security;
alter table public.matches  enable row level security;

-- profiles
create policy "Users read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Insert own profile"       on public.profiles for insert with check (auth.uid() = id);

-- events — public read
create policy "Anyone reads events" on public.events for select using (is_active = true);

-- listings — active ones are public; owner can CRUD
create policy "Anyone reads active listings" on public.listings for select
  using (status = 'ACTIVE' or auth.uid() = user_id);
create policy "Owner inserts listing"    on public.listings for insert with check (auth.uid() = user_id);
create policy "Owner updates listing"    on public.listings for update using (auth.uid() = user_id);

-- requests — owner only
create policy "Owner reads requests"  on public.requests for select  using (auth.uid() = user_id);
create policy "Owner inserts request" on public.requests for insert  with check (auth.uid() = user_id);
create policy "Owner updates request" on public.requests for update  using (auth.uid() = user_id);

-- matches — visible to both parties
create policy "Parties read match" on public.matches for select using (
  exists (select 1 from public.listings l where l.id = listing_id and l.user_id = auth.uid())
  or
  exists (select 1 from public.requests r where r.id = request_id and r.user_id = auth.uid())
);

-- ── Auto-create profile trigger ────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, whatsapp)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', null)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── updated_at trigger ─────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger listings_updated_at before update on public.listings
  for each row execute procedure public.touch_updated_at();
create trigger requests_updated_at before update on public.requests
  for each row execute procedure public.touch_updated_at();

-- ── Seed Events ────────────────────────────────────────────
insert into public.events (id, name, artist, date, venue, city, category, visual, is_featured) values
  ('00000000-0000-0000-0000-000000000001', 'Colombia vs Portugal', 'FIFA', '2026-06-27', 'Hard Rock Stadium', 'Miami', 'MUNDIAL', 'linear-gradient(150deg,#0A2515 0%,#155C30 50%,#9A7800 100%)', true),
  ('00000000-0000-0000-0000-000000000002', 'Karol G', 'Karol G', '2026-12-04', 'Estadio El Campín', 'Bogotá', 'CONCIERTO', 'linear-gradient(150deg,#1A0635 0%,#5B0FA0 55%,#C2185B 100%)', true),
  ('00000000-0000-0000-0000-000000000003', 'Iron Maiden', 'Iron Maiden', '2026-10-11', 'Movistar Arena', 'Bogotá', 'ROCK', 'linear-gradient(150deg,#080808 0%,#220000 50%,#550000 100%)', false),
  ('00000000-0000-0000-0000-000000000004', 'Gorillaz', 'Gorillaz', '2026-11-18', 'Royal Arena', 'Bogotá', 'CONCIERTO', 'linear-gradient(150deg,#091520 0%,#0D3040 55%,#C2560A 100%)', false),
  ('00000000-0000-0000-0000-000000000005', 'EDC Colombia 2026', 'Various', '2026-10-10', 'Autódromo de Tocancipá', 'Tocancipá', 'FESTIVAL', 'linear-gradient(150deg,#020C1A 0%,#103560 55%,#5B2FCF 100%)', false),
  ('00000000-0000-0000-0000-000000000006', 'Morat', 'Morat', '2026-08-15', 'Movistar Arena', 'Bogotá', 'CONCIERTO', 'linear-gradient(150deg,#0A0A1A 0%,#1A0060 55%,#3A40A0 100%)', false)
on conflict (id) do nothing;
