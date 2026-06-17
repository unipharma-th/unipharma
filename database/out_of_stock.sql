-- ============================================================
-- UNIPHARMA — Out of Stock reporting + Realtime
-- ============================================================
-- Run this once in your Supabase project:
--   Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- This adds the shared "out of stock" report table used by the
-- 📸 สินค้าหมด page, and turns on Supabase Realtime so every browser
-- sees new reports and data changes live (no refresh needed).
-- ============================================================

-- ---------- Out of stock reports ----------
create table if not exists out_of_stock (
  id            text primary key,          -- 'oos_<timestamp>'
  product_code  text,                      -- linked drug code (may be empty for free text)
  product_name  text,
  notes         text,
  image         text,                      -- base64 data URL (small photos only)
  reported_by   text,                      -- role/name of reporter
  period_start  date,                      -- Monday of the 7-day reporting window
  created_at    timestamptz default now()
);
create index if not exists oos_period_idx  on out_of_stock(period_start);
create index if not exists oos_created_idx on out_of_stock(created_at desc);

-- Soft-remove: admin/manager mark an item handled after ordering. The row
-- stays in the table (kept as statistics/history); the dashboard active
-- list simply hides rows where resolved_at is set.
alter table out_of_stock add column if not exists resolved_at timestamptz;
alter table out_of_stock add column if not exists resolved_by text;

-- ---------- Row Level Security (same convention as schema.sql) ----------
alter table out_of_stock enable row level security;
drop policy if exists anon_all on out_of_stock;
create policy anon_all on out_of_stock
  for all to anon, authenticated using (true) with check (true);

-- ============================================================
-- Realtime — broadcast row changes to every connected browser
-- ============================================================
-- supabase_realtime is the default publication Supabase listens on.
-- Adding a table here makes INSERT/UPDATE/DELETE events stream live.
-- (Safe to re-run: errors if a table is already a member, so we guard.)
do $$
declare t text;
begin
  foreach t in array array['out_of_stock','drugs','suppliers','purchase_orders']
  loop
    begin
      execute format('alter publication supabase_realtime add table %I;', t);
    exception
      when duplicate_object then null;  -- already added, ignore
      when others then null;            -- publication missing perms, ignore
    end;
  end loop;
end $$;

-- ============================================================
-- Done. The 📸 สินค้าหมด page now shares reports across all users,
-- and changes appear live without refreshing.
-- ============================================================
