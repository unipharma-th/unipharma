-- ============================================================
-- UNIPHARMA — Authentication & Role-based access (run AFTER schema.sql)
-- ------------------------------------------------------------
-- Roles:
--   admin   — full access (read/write/delete everything)
--   manager — create/edit + approve POs (no delete)
--   viewer  — read-only
--
-- Accounts are created by the admin in Supabase Dashboard
-- (Authentication → Users → Add user). New users default to 'viewer';
-- the admin promotes them with the UPDATE at the bottom of this file.
-- ============================================================

-- ---------- profiles: one row per auth user ----------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'viewer' check (role in ('admin','manager','viewer')),
  created_at  timestamptz default now()
);

-- auto-create a profile whenever a new auth user is added
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- role of the current caller (security definer to read profiles under RLS)
create or replace function auth_role() returns text as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'viewer');
$$ language sql stable security definer set search_path = public;

-- ---------- profiles RLS ----------
alter table profiles enable row level security;
drop policy if exists profiles_self_read   on profiles;
drop policy if exists profiles_admin_read   on profiles;
drop policy if exists profiles_admin_write  on profiles;
create policy profiles_self_read  on profiles for select to authenticated
  using (id = auth.uid() or auth_role() = 'admin');
create policy profiles_admin_write on profiles for all to authenticated
  using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- ============================================================
-- Replace the open "anon_all" policies with authenticated, role-aware ones
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['drugs','suppliers','purchase_orders',
                           'stock_movements','sync_history','categories','branches']
  loop
    -- remove the permissive policy created by schema.sql
    execute format('drop policy if exists anon_all on %I;', t);
    execute format('drop policy if exists read_all on %I;', t);
    execute format('drop policy if exists write_staff on %I;', t);
    execute format('drop policy if exists delete_admin on %I;', t);

    -- everyone logged in can read
    execute format(
      'create policy read_all on %I for select to authenticated using (true);', t);
    -- admin + manager can insert/update
    execute format(
      'create policy write_staff on %I for insert to authenticated with check (auth_role() in (''admin'',''manager''));', t);
    execute format(
      'create policy write_staff_upd on %I for update to authenticated using (auth_role() in (''admin'',''manager'')) with check (auth_role() in (''admin'',''manager''));', t);
    -- only admin can delete
    execute format(
      'create policy delete_admin on %I for delete to authenticated using (auth_role() = ''admin'');', t);
  end loop;
end $$;

-- ============================================================
-- IMPORTANT — after you create your admin user in the Dashboard,
-- run this once with your real email to promote it to admin:
-- ============================================================
-- update profiles set role = 'admin' where email = 'YOUR_ADMIN_EMAIL@example.com';
--
-- To make someone a purchasing manager:
-- update profiles set role = 'manager' where email = 'manager@example.com';
-- ============================================================
