-- ============================================================================
-- [SUPERSEDED / ملغي - لا تشغّله]
-- تم استبدال هذا المخطط الأولي بالمخطط الآمن والمحدث في:
-- supabase/migrations/002_secure_store_schema.sql
-- أسباب الاستبدال:
-- 1. وجود خطأ في الصياغة (syntax error) في السطور 70 و75 ($ بدل $$) يمنع اكتمال التنفيذ.
-- 2. دالة create_store_order كانت تثق في الأسعار والإجماليات القادمة من المتصفح بدون تحقق سيرفر.
-- 3. المنتجات كانت مخزنة في jsonb غير مفهرس بدون أعمدة أسعار رقمية صريحة.
-- الرجاء استخدام 002_secure_store_schema.sql و003_seed_catalog.sql بدلاً منه.
-- ============================================================================

-- Daimond Store: initial Supabase schema. Run in Supabase SQL Editor.
-- Never expose service_role/secret keys in browser code.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.products (
  id text primary key, data jsonb not null, is_active boolean not null default true,
  sort_order integer not null default 0, updated_at timestamptz not null default now()
);
create table if not exists public.categories (
  id text primary key, data jsonb not null, is_active boolean not null default true,
  sort_order integer not null default 0, updated_at timestamptz not null default now()
);
create table if not exists public.hero_slides (
  id text primary key, data jsonb not null, is_active boolean not null default true,
  sort_order integer not null default 0, updated_at timestamptz not null default now()
);
create table if not exists public.store_settings (
  id text primary key default 'default' check (id = 'default'),
  data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);
create table if not exists public.coupons (
  code text primary key, data jsonb not null, is_active boolean not null default true,
  updated_at timestamptz not null default now()
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique default ('DM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  created_at timestamptz not null default now(), customer text not null, phone text not null,
  gov text not null, address text not null, payment text not null, transfer_ref text,
  payment_screenshot_path text, subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0), coupon text,
  shipping numeric(12,2) not null default 0 check (shipping >= 0), warranty text,
  total numeric(12,2) not null check (total >= 0), status text not null default 'جديد'
);
create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text, model text, name text not null, qty integer not null check (qty > 0),
  price numeric(12,2) not null check (price >= 0)
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

create or replace function public.is_store_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and active = true);
$$;

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.hero_slides enable row level security;
alter table public.store_settings enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "admins read own membership" on public.admin_users
for select to authenticated using (user_id = auth.uid());
create or replace function public.is_store_super_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp
as $
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid() and active = true and role = 'super_admin'
  );
$;
create policy "super admins manage memberships" on public.admin_users
for all to authenticated using (public.is_store_super_admin()) with check (public.is_store_super_admin());

create policy "public read active products" on public.products
for select to anon, authenticated using (is_active = true or public.is_store_admin());
create policy "admins manage products" on public.products
for all to authenticated using (public.is_store_admin()) with check (public.is_store_admin());
create policy "public read active categories" on public.categories
for select to anon, authenticated using (is_active = true or public.is_store_admin());
create policy "admins manage categories" on public.categories
for all to authenticated using (public.is_store_admin()) with check (public.is_store_admin());
create policy "public read active hero slides" on public.hero_slides
for select to anon, authenticated using (is_active = true or public.is_store_admin());
create policy "admins manage hero slides" on public.hero_slides
for all to authenticated using (public.is_store_admin()) with check (public.is_store_admin());
create policy "public read store settings" on public.store_settings
for select to anon, authenticated using (true);
create policy "admins manage store settings" on public.store_settings
for all to authenticated using (public.is_store_admin()) with check (public.is_store_admin());
create policy "admins manage coupons" on public.coupons
for all to authenticated using (public.is_store_admin()) with check (public.is_store_admin());

create policy "admins read orders" on public.orders
for select to authenticated using (public.is_store_admin());
create policy "admins update orders" on public.orders
for update to authenticated using (public.is_store_admin()) with check (public.is_store_admin());
create policy "admins delete orders" on public.orders
for delete to authenticated using (public.is_store_admin());
create policy "admins read order items" on public.order_items
for select to authenticated using (public.is_store_admin());
create policy "admins manage order items" on public.order_items
for all to authenticated using (public.is_store_admin()) with check (public.is_store_admin());

-- Guest checkout inserts through this RPC; guests cannot read customer orders.
create or replace function public.create_store_order(p_order jsonb)
returns table (id uuid, order_code text)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_order_id uuid; v_code text; v_item jsonb; v_items jsonb;
begin
  if p_order is null or jsonb_typeof(p_order) <> 'object' then raise exception 'Invalid order payload'; end if;
  if coalesce(length(trim(p_order->>'customer')), 0) < 2
     or coalesce(length(regexp_replace(p_order->>'phone', '[^0-9]', '', 'g')), 0) < 10
     or coalesce(length(trim(p_order->>'address')), 0) < 5
     or coalesce(length(trim(p_order->>'gov')), 0) < 2 then
    raise exception 'Missing or invalid customer details';
  end if;
  v_items := p_order->'items';
  if v_items is null or jsonb_typeof(v_items) <> 'array'
     or jsonb_array_length(v_items) < 1 or jsonb_array_length(v_items) > 50 then
    raise exception 'Invalid order items';
  end if;
  insert into public.orders (customer, phone, gov, address, payment, transfer_ref, subtotal, discount, coupon, shipping, warranty, total, status)
  values (trim(p_order->>'customer'), trim(p_order->>'phone'), trim(p_order->>'gov'), trim(p_order->>'address'),
    coalesce(nullif(trim(p_order->>'payment'), ''), 'الدفع عند الاستلام'), nullif(trim(p_order->>'transferRef'), ''),
    greatest(coalesce((p_order->>'subtotal')::numeric, 0), 0), greatest(coalesce((p_order->>'discount')::numeric, 0), 0),
    nullif(trim(p_order->>'coupon'), ''), greatest(coalesce((p_order->>'shipping')::numeric, 0), 0),
    nullif(trim(p_order->>'warranty'), ''), greatest(coalesce((p_order->>'total')::numeric, 0), 0), 'جديد')
  returning public.orders.id, public.orders.order_code into v_order_id, v_code;
  for v_item in select value from jsonb_array_elements(v_items) loop
    if coalesce(length(trim(v_item->>'name')), 0) < 1
       or coalesce((v_item->>'qty')::integer, 0) < 1
       or coalesce((v_item->>'price')::numeric, -1) < 0 then raise exception 'Invalid order item'; end if;
    insert into public.order_items (order_id, product_id, model, name, qty, price)
    values (v_order_id, nullif(v_item->>'id', ''), nullif(v_item->>'model', ''), trim(v_item->>'name'),
      (v_item->>'qty')::integer, (v_item->>'price')::numeric);
  end loop;
  return query select v_order_id, v_code;
end;
$$;
revoke all on function public.create_store_order(jsonb) from public;
grant execute on function public.create_store_order(jsonb) to anon, authenticated;
revoke all on public.admin_users, public.products, public.categories, public.hero_slides,
  public.store_settings, public.coupons, public.orders, public.order_items from anon, authenticated;
grant select on public.admin_users to authenticated;
grant select on public.products, public.categories, public.hero_slides, public.store_settings to anon, authenticated;
grant select, insert, update, delete on public.products, public.categories, public.hero_slides,
  public.store_settings, public.coupons, public.orders, public.order_items to authenticated;
