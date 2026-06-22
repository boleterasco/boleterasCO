-- ── Migration 002: Add image_url column + Supabase Storage bucket ───────────
-- Run in: Supabase Dashboard → SQL Editor

alter table public.events
  add column if not exists image_url text;

-- ── Storage bucket setup (run once in Supabase Dashboard → Storage) ──────────
-- 1. Create a bucket named "event-images"  (Public bucket)
-- 2. Run the policies below:

insert into storage.buckets (id, name, public)
  values ('event-images', 'event-images', true)
  on conflict (id) do nothing;

-- Allow admin service-role to upload (no policy needed — service role bypasses)
-- Allow public to read (since bucket is public)
create policy "Public read event images"
  on storage.objects for select
  using (bucket_id = 'event-images');
