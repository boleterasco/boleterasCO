-- ── Migration 003: Align column names with application code ──────────────────
-- Run in: Supabase Dashboard → SQL Editor
-- This migration renames columns to match what the Next.js app expects.

-- ── 1. listings: user_id → seller_id, price_cop → price_per_ticket ───────────

-- Drop existing policies that reference user_id
drop policy if exists "Anyone reads active listings" on public.listings;
drop policy if exists "Owner inserts listing"        on public.listings;
drop policy if exists "Owner updates listing"        on public.listings;

-- Rename columns
alter table public.listings rename column user_id    to seller_id;
alter table public.listings rename column price_cop  to price_per_ticket;

-- Remove columns not used by the app
alter table public.listings drop column if exists contact_phone;
alter table public.listings drop column if exists contact_method;

-- Recreate policies with new column name
create policy "Anyone reads active listings"
  on public.listings for select
  using (status = 'ACTIVE' or auth.uid() = seller_id);

create policy "Owner inserts listing"
  on public.listings for insert
  with check (auth.uid() = seller_id);

create policy "Owner updates listing"
  on public.listings for update
  using (auth.uid() = seller_id);

-- ── 2. requests: user_id → buyer_id, max_price_cop → max_price ───────────────

-- Drop existing policies
drop policy if exists "Owner reads requests"  on public.requests;
drop policy if exists "Owner inserts request" on public.requests;
drop policy if exists "Owner updates request" on public.requests;

-- Rename columns
alter table public.requests rename column user_id       to buyer_id;
alter table public.requests rename column max_price_cop to max_price;

-- whatsapp field is optional in the app, allow nulls
alter table public.requests alter column whatsapp drop not null;

-- Recreate policies
create policy "Owner reads requests"
  on public.requests for select
  using (auth.uid() = buyer_id);

create policy "Owner inserts request"
  on public.requests for insert
  with check (auth.uid() = buyer_id);

create policy "Owner updates request"
  on public.requests for update
  using (auth.uid() = buyer_id);

-- ── 3. matches: add missing columns ──────────────────────────────────────────

alter table public.matches
  add column if not exists event_id  uuid references public.events(id) on delete cascade,
  add column if not exists price     bigint,
  add column if not exists quantity  smallint,
  add column if not exists section   text;

-- ── 4. Update matches policy (references listings.seller_id now) ─────────────

drop policy if exists "Parties read match" on public.matches;

create policy "Parties read match"
  on public.matches for select using (
    exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
    or
    exists (select 1 from public.requests r where r.id = request_id and r.buyer_id = auth.uid())
  );

-- ── 5. updated_at triggers (recreate with new column names) ──────────────────

drop trigger if exists listings_updated_at on public.listings;
drop trigger if exists requests_updated_at on public.requests;

create trigger listings_updated_at before update on public.listings
  for each row execute procedure public.touch_updated_at();
create trigger requests_updated_at before update on public.requests
  for each row execute procedure public.touch_updated_at();
