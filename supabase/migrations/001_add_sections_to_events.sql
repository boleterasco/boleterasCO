-- ── Migration 001: Add sections JSONB column to events ─────────────────────
-- Run in: Supabase Dashboard → SQL Editor
--
-- Each section object shape:
-- {
--   "id":          string,   -- random slug (e.g. "a1b2c3")
--   "name":        string,   -- e.g. "Palco VIP"
--   "description": string,   -- optional
--   "minPrice":    number,   -- COP, e.g. 500000
--   "maxPrice":    number    -- COP, e.g. 1200000
-- }

alter table public.events
  add column if not exists sections jsonb not null default '[]'::jsonb;

-- Allow admins to read/write sections via the admin client (service-role bypasses RLS)
-- No RLS policy needed — public can already read events, sections is safe to expose.

-- Optional: GIN index for fast JSON queries
create index if not exists events_sections_gin on public.events using gin (sections);
