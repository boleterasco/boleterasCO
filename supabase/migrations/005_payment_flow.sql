-- ── Migration 005: Payment flow ─────────────────────────────────────────────
-- Run in: Supabase Dashboard → SQL Editor

-- 1. Payment fields on matches
alter table public.matches
  add column if not exists payment_link_id  text,
  add column if not exists payment_id       text,
  add column if not exists payment_amount   bigint,
  add column if not exists paid_at          timestamptz,
  add column if not exists seller_deadline  timestamptz,
  add column if not exists transferred_at   timestamptz,
  add column if not exists completed_at     timestamptz,
  add column if not exists disputed_at      timestamptz;

-- 2. Expand status check to include payment states
alter table public.matches drop constraint if exists matches_status_check;
alter table public.matches add constraint matches_status_check
  check (status in ('PENDING','PAID','TRANSFERRED','COMPLETED','DISPUTED','ACCEPTED','REJECTED','EXPIRED'));

-- 3. Payout info on profiles
alter table public.profiles
  add column if not exists payout_method  text check (payout_method in ('nequi','daviplata','bank')),
  add column if not exists payout_phone   text,
  add column if not exists payout_bank    text,
  add column if not exists payout_account text,
  add column if not exists payout_holder  text,
  add column if not exists payout_cedula  text;
