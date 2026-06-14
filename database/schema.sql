-- ============================================================
-- UNIPHARMA Purchasing Management — Supabase / PostgreSQL schema
-- ============================================================
-- Run this once in your Supabase project:
--   Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- Design note: each entity keeps its full app object in a `data` jsonb
-- column (so the web app reads/writes the exact same shape it already
-- uses), plus a few flat columns that are indexed for fast filtering.
-- This keeps the app code almost unchanged while giving you a real
-- shared, relational database across all 3 branches.
-- ============================================================

-- ---------- Reference tables (optional — app also has these built-in) ----------
create table if not exists branches (
  id          text primary key,         -- 'PTN' | 'RAM' | 'CNX'
  code        text,                     -- '00' | '01' | '02'
  name_th     text,
  name_en     text,
  color       text
);

create table if not exists categories (
  id          text primary key,         -- 'CAT01'...
  name_th     text,
  name_en     text,
  color       text,
  subs        jsonb default '[]'::jsonb  -- subcategories [{id,name,nameEN}]
);

-- ---------- Master data ----------
create table if not exists drugs (
  code         text primary key,        -- 'AMX001'  (locked, never edited)
  name_th      text,
  name_en      text,
  cat_id       text,                    -- category id (no FK: kept import-safe; categories are app constants)
  sub_id       text,
  supplier_id  text,                    -- default supplier
  has_vat      boolean default false,
  cost_ex      numeric,
  sell_ex      numeric,
  total_stock  numeric,
  data         jsonb not null,          -- full drug object (stock, packaging, profit, etc.)
  updated_at   timestamptz default now()
);
create index if not exists drugs_cat_idx       on drugs(cat_id);
create index if not exists drugs_supplier_idx  on drugs(supplier_id);
create index if not exists drugs_name_th_idx   on drugs using gin (to_tsvector('simple', coalesce(name_th,'')));

create table if not exists suppliers (
  id           text primary key,        -- 'SUP001'
  code         text,
  name         text,
  name_en      text,
  category     text,
  data         jsonb not null,          -- contact, phone, promotions[], drugs[], etc.
  updated_at   timestamptz default now()
);

-- ---------- Transactional data ----------
create table if not exists purchase_orders (
  id              text primary key,     -- internal id ('PO001'...) or generated
  po_number       text unique,          -- 'PO00-260611-001'
  branch          text,
  supplier_id     text,
  status          text default 'draft', -- draft|pending|approved|completed
  po_date         date,
  grand_total     numeric,
  is_non_po       boolean default false,
  data            jsonb not null,       -- items[], totals, terms, createdBy, etc.
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists po_branch_idx   on purchase_orders(branch);
create index if not exists po_status_idx   on purchase_orders(status);
create index if not exists po_date_idx     on purchase_orders(po_date desc);

create table if not exists stock_movements (
  id        bigserial primary key,
  moved_on  date,
  type      text,                       -- 'in' | 'out'
  code      text,
  branch    text,
  qty       numeric,
  reason    text,
  data      jsonb default '{}'::jsonb
);
create index if not exists mov_code_idx   on stock_movements(code);
create index if not exists mov_branch_idx on stock_movements(branch);

-- ---------- Sync audit log ----------
create table if not exists sync_history (
  id         bigserial primary key,
  source     text,                      -- 'google_sheets' | 'excel' | 'manual'
  kind       text,                      -- 'drugs' | 'suppliers' | 'stock' | 'all'
  count      integer,
  synced_at  timestamptz default now()
);

-- ---------- keep updated_at fresh ----------
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_drugs_touch on drugs;
create trigger trg_drugs_touch before update on drugs
  for each row execute function touch_updated_at();
drop trigger if exists trg_suppliers_touch on suppliers;
create trigger trg_suppliers_touch before update on suppliers
  for each row execute function touch_updated_at();
drop trigger if exists trg_po_touch on purchase_orders;
create trigger trg_po_touch before update on purchase_orders
  for each row execute function touch_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
-- The app currently has NO login (internal use). The policies below let
-- the public "anon" key read & write everything. This is acceptable for a
-- private internal tool whose URL/key you do not publish, BUT anyone with
-- the link + anon key could read/write. To lock it down later, turn on
-- Supabase Auth and replace `using (true)` with `auth.role() = 'authenticated'`.
-- ------------------------------------------------------------
alter table branches         enable row level security;
alter table categories       enable row level security;
alter table drugs            enable row level security;
alter table suppliers        enable row level security;
alter table purchase_orders  enable row level security;
alter table stock_movements  enable row level security;
alter table sync_history     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['branches','categories','drugs','suppliers',
                           'purchase_orders','stock_movements','sync_history']
  loop
    execute format('drop policy if exists anon_all on %I;', t);
    execute format(
      'create policy anon_all on %I for all to anon, authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- ============================================================
-- Done. Next: import your drugs/suppliers (see database/README.md).
-- ============================================================
