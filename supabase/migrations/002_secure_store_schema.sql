-- ============================================================================
-- DIAMOND STORE - SECURE STORE SCHEMA & BACKEND LOGIC (MIGRATION 002)
-- Supabase Project: diamond-store (Organization: daimond-store)
-- Target: PostgreSQL 15+ / Supabase
--
-- Features:
-- 1. Non-destructive migration guards for any partial legacy schema (001).
-- 2. Fully typed tables for products, categories, hero slides, settings, coupons,
--    orders, order items, and audit history.
-- 3. Strict Row Level Security (RLS) on every single exposed table.
-- 4. Server-side price calculation & order processing RPCs (quote_cart, create_order).
--    Never trusts client prices, subtotals, or discounts.
--    Validates stock, deduplicates items/bundles, enforces allowed bundle pool,
--    and atomically decrements stock on order creation.
-- 5. Configurable Rate Limiting via store_settings (default: 3 orders / 10 mins).
-- 6. Storage buckets configuration for product media and private payment proofs.
-- ============================================================================

do $$
begin
  create extension if not exists pgcrypto;
exception
  when others then null;
end $$;

-- ============================================================================
-- 1. NON-DESTRUCTIVE GUARDS FOR EXISTING LEGACY SCHEMAS (001)
-- ============================================================================
do $$
begin
  -- If legacy untyped products table exists (has 'data' column and no 'price' column),
  -- safely rename it to legacy_products_001 instead of dropping it.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'data'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'price'
  ) then
    alter table public.products rename to legacy_products_001;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'categories' and column_name = 'data'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'categories' and column_name = 'name'
  ) then
    alter table public.categories rename to legacy_categories_001;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hero_slides' and column_name = 'data'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hero_slides' and column_name = 'title'
  ) then
    alter table public.hero_slides rename to legacy_hero_slides_001;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'coupons' and column_name = 'data'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'coupons' and column_name = 'discount_value'
  ) then
    alter table public.coupons rename to legacy_coupons_001;
  end if;

  -- If legacy order_items from 001 exists (has 'price' instead of 'unit_price'), rename it first
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'order_items' and column_name = 'price'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'order_items' and column_name = 'unit_price'
  ) then
    alter table public.order_items rename to legacy_order_items_001;
  end if;

  -- If legacy orders from 001 exists (has 'coupon' instead of 'coupon_code'), rename it
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'coupon'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'coupon_code'
  ) then
    alter table public.orders rename to legacy_orders_001;
  end if;
end $$;

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- 2.1 Admin Users & RBAC
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  active boolean not null default true,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Ensure columns exist if admin_users was previously created by 001
alter table public.admin_users add column if not exists display_name text;
alter table public.admin_users add column if not exists updated_at timestamptz not null default now();

-- 2.2 Store Categories
create table if not exists public.categories (
  id text primary key,
  name text not null,
  nav_title text,
  en_name text,
  subtitle text,
  icon text default 'fa-tag',
  image text,
  sub_items jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists categories_sort_order_idx on public.categories (sort_order);
create index if not exists categories_is_active_idx on public.categories (is_active);

-- 2.3 Store Products (Typed Schema)
create table if not exists public.products (
  id text primary key,
  model text,
  name text not null,
  category text not null,
  category_label text,
  wattage text,
  capacity text,
  warranty text default 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
  shipping text default 'شحن مجاني لجميع المحافظات',
  price numeric(12,2) not null check (price >= 0),
  old_price numeric(12,2) check (old_price is null or old_price >= price),
  rating numeric(3,2) not null default 4.80 check (rating >= 0 and rating <= 5),
  reviews_count integer not null default 0 check (reviews_count >= 0),
  badge text,
  in_stock boolean not null default true,
  stock_qty integer not null default 100 check (stock_qty >= 0),
  image text not null,
  gallery jsonb not null default '[]'::jsonb,
  fallback_image text,
  short_desc text,
  specs jsonb not null default '{}'::jsonb,
  features jsonb not null default '[]'::jsonb,
  video_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_is_active_idx on public.products (is_active);
create index if not exists products_sort_order_idx on public.products (sort_order);

-- 2.4 Hero Slides Showcase
create table if not exists public.hero_slides (
  id text primary key,
  num text not null,
  tag text,
  title text not null,
  subtitle text,
  model text,
  power text,
  capacity text,
  price text,
  image text not null,
  fit_mode text default 'contain',
  product_id text references public.products(id) on delete set null on update cascade,
  category_id text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hero_slides_sort_order_idx on public.hero_slides (sort_order);
create index if not exists hero_slides_is_active_idx on public.hero_slides (is_active);

-- 2.5 Store Settings (Single Row Pattern)
create table if not exists public.store_settings (
  id text primary key default 'default' check (id = 'default'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2.6 Discount Coupons
create table if not exists public.coupons (
  code text primary key,
  discount_type text not null default 'percent' check (discount_type in ('percent', 'fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  min_order_total numeric(12,2) not null default 0 check (min_order_total >= 0),
  max_discount numeric(12,2) check (max_discount is null or max_discount > 0),
  bundle_ids jsonb default null,
  starts_at timestamptz,
  expires_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists coupons_is_active_idx on public.coupons (is_active);

-- 2.7 Orders (Customer & Guest Checkout)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique default ('DM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  created_at timestamptz not null default now(),
  customer text not null check (length(trim(customer)) >= 2),
  phone text not null check (phone ~ '^01[0125][0-9]{8}$'),
  gov text not null check (length(trim(gov)) >= 2),
  address text not null check (length(trim(address)) >= 5),
  notes text,
  payment text not null default 'الدفع عند الاستلام',
  transfer_ref text,
  payment_screenshot_path text,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  discount_type text default null check (discount_type is null or discount_type in ('coupon', 'bundle')),
  coupon_code text,
  coupon_discount numeric(12,2) not null default 0 check (coupon_discount >= 0),
  bundle_discount numeric(12,2) not null default 0 check (bundle_discount >= 0),
  bundle_ids jsonb default null,
  shipping numeric(12,2) not null default 0 check (shipping >= 0),
  warranty text default 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
  total numeric(12,2) not null check (total >= 0),
  status text not null default 'جديد' check (status in ('جديد', 'قيد التجهيز', 'تم الشحن', 'تم التوصيل', 'ملغي', 'مؤجل')),
  client_ip inet,
  user_agent text,
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_phone_idx on public.orders (phone);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_order_code_idx on public.orders (order_code);

-- 2.8 Order Items
create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null on update cascade,
  model text,
  name text not null,
  qty integer not null check (qty > 0 and qty <= 50),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  bundle_applied boolean not null default false
);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

-- 2.9 Order Status & Audit History
create table if not exists public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_id_idx on public.order_status_history (order_id);

-- ============================================================================
-- 3. HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

-- 3.1 Updated_at trigger function
create or replace function public.set_updated_at_column()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_admin_users_updated_at on public.admin_users;
create trigger trg_admin_users_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at_column();

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at_column();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at_column();

drop trigger if exists trg_hero_slides_updated_at on public.hero_slides;
create trigger trg_hero_slides_updated_at
  before update on public.hero_slides
  for each row execute function public.set_updated_at_column();

drop trigger if exists trg_store_settings_updated_at on public.store_settings;
create trigger trg_store_settings_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at_column();

drop trigger if exists trg_coupons_updated_at on public.coupons;
create trigger trg_coupons_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at_column();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at_column();

-- 3.2 Audit logging trigger on order status change
create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.status is distinct from new.status then
    insert into public.order_status_history (order_id, old_status, new_status, changed_by, note)
    values (new.id, old.status, new.status, auth.uid(), 'تحديث تلقائي لحالة الطلب');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_status_history on public.orders;
create trigger trg_orders_status_history
  after update on public.orders
  for each row execute function public.log_order_status_change();

-- 3.3 Authorization helper functions
create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and active = true
  );
$$;

create or replace function public.is_store_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and active = true
      and role = 'super_admin'
  );
$$;

-- 3.4 Protect the last remaining super_admin from accidental deletion/deactivation
create or replace function public.prevent_last_super_admin_removal()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if (tg_op = 'DELETE' and old.role = 'super_admin' and old.active = true) or
     (tg_op = 'UPDATE' and old.role = 'super_admin' and (new.active = false or new.role <> 'super_admin')) then
    select count(*) into v_count
    from public.admin_users
    where role = 'super_admin' and active = true and user_id <> old.user_id;

    if v_count < 1 then
      raise exception 'لا يمكن حذف أو تعطيل المشرف الرئيسي الأخير في المتجر.';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_protect_last_super_admin on public.admin_users;
create trigger trg_protect_last_super_admin
  before update or delete on public.admin_users
  for each row execute function public.prevent_last_super_admin_removal();

-- 3.5 Protect order_items prices and quantities from post-order tampering
create or replace function public.protect_order_items()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' then
    if new.unit_price is distinct from old.unit_price
       or new.line_total is distinct from old.line_total
       or new.qty is distinct from old.qty
       or new.product_id is distinct from old.product_id
       or new.order_id is distinct from old.order_id then
      raise exception 'لا يمكن تعديل عناصر الطلب أو أسعارها بعد تسجيل الطلب حفاظاً على سلامة السجلات المالية.';
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if exists (select 1 from public.orders where id = old.order_id) and not public.is_store_super_admin() then
      raise exception 'لا يمكن حذف عناصر من طلب قائم.';
    end if;
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_order_items on public.order_items;
create trigger trg_protect_order_items
  before update or delete on public.order_items
  for each row execute function public.protect_order_items();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.hero_slides enable row level security;
alter table public.store_settings enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

-- 4.1 admin_users
drop policy if exists "admins read own membership" on public.admin_users;
create policy "admins read own membership" on public.admin_users
  for select to authenticated
  using (user_id = auth.uid() or public.is_store_super_admin());

drop policy if exists "super admins manage memberships" on public.admin_users;
create policy "super admins manage memberships" on public.admin_users
  for all to authenticated
  using (public.is_store_super_admin())
  with check (public.is_store_super_admin());

-- 4.2 categories (separated anon vs authenticated so anon never invokes admin helper)
drop policy if exists "public read active categories" on public.categories;
create policy "public read active categories" on public.categories
  for select to anon
  using (is_active = true);

drop policy if exists "authenticated read categories" on public.categories;
create policy "authenticated read categories" on public.categories
  for select to authenticated
  using (is_active = true or public.is_store_admin());

drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories" on public.categories
  for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

-- 4.3 products
drop policy if exists "public read active products" on public.products;
create policy "public read active products" on public.products
  for select to anon
  using (is_active = true);

drop policy if exists "authenticated read products" on public.products;
create policy "authenticated read products" on public.products
  for select to authenticated
  using (is_active = true or public.is_store_admin());

drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products
  for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

-- 4.4 hero_slides
drop policy if exists "public read active hero slides" on public.hero_slides;
create policy "public read active hero slides" on public.hero_slides
  for select to anon
  using (is_active = true);

drop policy if exists "authenticated read hero slides" on public.hero_slides;
create policy "authenticated read hero slides" on public.hero_slides
  for select to authenticated
  using (is_active = true or public.is_store_admin());

drop policy if exists "admins manage hero slides" on public.hero_slides;
create policy "admins manage hero slides" on public.hero_slides
  for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

-- 4.5 store_settings
drop policy if exists "public read store settings" on public.store_settings;
create policy "public read store settings" on public.store_settings
  for select to anon, authenticated
  using (true);

drop policy if exists "admins manage store settings" on public.store_settings;
create policy "admins manage store settings" on public.store_settings
  for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

-- 4.6 coupons (Admins only direct access; public accesses via quote_cart RPC)
drop policy if exists "admins manage coupons" on public.coupons;
create policy "admins manage coupons" on public.coupons
  for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

-- 4.7 orders (Admins only direct access; customers submit via create_order RPC)
drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders" on public.orders
  for select to authenticated
  using (public.is_store_admin());

drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders
  for update to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

drop policy if exists "super admins delete orders" on public.orders;
create policy "super admins delete orders" on public.orders
  for delete to authenticated
  using (public.is_store_super_admin());

-- 4.8 order_items
drop policy if exists "admins read order items" on public.order_items;
create policy "admins read order items" on public.order_items
  for select to authenticated
  using (public.is_store_admin());

drop policy if exists "super admins manage order items" on public.order_items;
create policy "super admins manage order items" on public.order_items
  for all to authenticated
  using (public.is_store_super_admin())
  with check (public.is_store_super_admin());

-- 4.9 order_status_history
drop policy if exists "admins read order status history" on public.order_status_history;
create policy "admins read order status history" on public.order_status_history
  for select to authenticated
  using (public.is_store_admin());

-- ============================================================================
-- 5. SECURE SERVER-SIDE PRICING & ORDER RPCS
-- ============================================================================

-- 5.1 quote_cart: Server-side price calculation & stock/bundle/coupon validation
create or replace function public.quote_cart(
  p_items jsonb,
  p_coupon text default null,
  p_bundle_ids jsonb default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_item jsonb;
  v_prod_id text;
  v_qty integer;
  v_product record;
  v_subtotal numeric(12,2) := 0;
  v_total_count integer := 0;
  v_quoted_items jsonb := '[]'::jsonb;
  v_cart_ids text[] := array[]::text[];

  v_settings jsonb := '{}'::jsonb;
  v_bundle_enabled boolean := true;
  v_bundle_tier2 numeric(5,2) := 10;
  v_bundle_tier3 numeric(5,2) := 18;
  v_bundle_tier4 numeric(5,2) := 25;
  v_bundle_custom_fixed numeric(12,2) := 0;
  v_bundle_allowed_ids jsonb := '[]'::jsonb;
  v_bundle_default_ids jsonb := '[]'::jsonb;

  v_bundle_count integer := 0;
  v_bundle_raw_total numeric(12,2) := 0;
  v_bundle_discount numeric(12,2) := 0;
  v_bundle_all_in_cart boolean := true;
  v_bundle_id text;
  v_seen_bundle_ids text[] := array[]::text[];
  v_is_default_bride boolean := false;

  v_coupon_record record;
  v_coupon_discount numeric(12,2) := 0;
  v_coupon_valid boolean := false;
  v_coupon_message text := null;

  v_effective_discount numeric(12,2) := 0;
  v_discount_type text := null;
  v_shipping numeric(12,2) := 0;
  v_final_total numeric(12,2) := 0;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'سلة التسوق فارغة أو غير صحيحة';
  end if;

  if jsonb_array_length(p_items) > 50 then
    raise exception 'الحد الأقصى للمنتجات في السلة هو 50 منتج';
  end if;

  -- Load store settings for bundle & shipping
  select data into v_settings from public.store_settings where id = 'default';
  if v_settings is not null then
    v_bundle_enabled := coalesce((v_settings->>'bundleEnabled')::boolean, true);
    v_bundle_tier2 := coalesce((v_settings->>'bundleTier2')::numeric, 10);
    v_bundle_tier3 := coalesce((v_settings->>'bundleTier3')::numeric, 18);
    v_bundle_tier4 := coalesce((v_settings->>'bundleTier4')::numeric, 25);
    v_bundle_custom_fixed := coalesce((v_settings->>'bundleCustomFixedPrice')::numeric, 0);
    v_bundle_allowed_ids := coalesce(v_settings->'bundleProductIds', '[]'::jsonb);
    v_bundle_default_ids := coalesce(v_settings->'bundleDefaultSelectedIds', '[]'::jsonb);
  end if;

  -- Iterate through requested items, reject duplicates, verify stock & active state, and price using DB
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_prod_id := trim(coalesce(v_item->>'id', ''));
    v_qty := coalesce((v_item->>'qty')::integer, 0);

    if v_prod_id = '' or v_qty < 1 or v_qty > 50 then
      raise exception 'بيانات عنصر السلة غير صحيحة (معرف: %, الكمية: %)', v_prod_id, v_qty;
    end if;

    if v_prod_id = any(v_cart_ids) then
      raise exception 'لا يمكن تكرار نفس المنتج في سلة الطلب أكثر من مرة (%). يرجى تعديل الكمية بدلاً من التكرار.', v_prod_id;
    end if;

    select id, name, model, price, in_stock, stock_qty, is_active
    into v_product
    from public.products
    where id = v_prod_id;

    if not found then
      raise exception 'المنتج المطلوب غير موجود بالمتجر: %', v_prod_id;
    end if;

    if not v_product.is_active then
      raise exception 'المنتج غير متاح حالياً بالمتجر: %', v_product.name;
    end if;

    if not v_product.in_stock or coalesce(v_product.stock_qty, 0) < 1 then
      raise exception 'عذراً، المنتج نفد من المخزن حالياً: %', v_product.name;
    end if;

    if v_qty > v_product.stock_qty then
      raise exception 'الكمية المطلوبة (%) من المنتج "%" تتجاوز المتاح بالمخزن (% قطعة)', v_qty, v_product.name, v_product.stock_qty;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_qty);
    v_total_count := v_total_count + v_qty;
    v_cart_ids := array_append(v_cart_ids, v_product.id);

    v_quoted_items := v_quoted_items || jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'model', v_product.model,
      'qty', v_qty,
      'unit_price', v_product.price,
      'line_total', (v_product.price * v_qty)
    );
  end loop;

  -- Check Bride Bundle Discount (with duplicate check and allowed bundle pool check)
  if v_bundle_enabled and p_bundle_ids is not null and jsonb_typeof(p_bundle_ids) = 'array' and jsonb_array_length(p_bundle_ids) >= 2 then
    for v_bundle_id in select jsonb_array_elements_text(p_bundle_ids) loop
      v_bundle_id := trim(coalesce(v_bundle_id, ''));
      if v_bundle_id = '' then
        raise exception 'معرف جهاز الباكدج غير صالح';
      end if;

      -- Reject duplicate IDs inside p_bundle_ids
      if v_bundle_id = any(v_seen_bundle_ids) then
        raise exception 'لا يمكن تكرار نفس الجهاز داخل باكدج العروسة (%)', v_bundle_id;
      end if;
      v_seen_bundle_ids := array_append(v_seen_bundle_ids, v_bundle_id);

      -- Verify product is in the allowed bundleProductIds list from store_settings
      if jsonb_typeof(v_bundle_allowed_ids) = 'array' and jsonb_array_length(v_bundle_allowed_ids) > 0 then
        if not (v_bundle_allowed_ids ? v_bundle_id) then
          raise exception 'المنتج (%) غير مدرج ضمن قائمة أجهزة باكدج العروسة المسموحة', v_bundle_id;
        end if;
      end if;

      -- Check if every bundle product is in the cart
      if not (v_bundle_id = any(v_cart_ids)) then
        v_bundle_all_in_cart := false;
        exit;
      end if;

      select price into v_product from public.products where id = v_bundle_id and is_active = true and in_stock = true;
      if found then
        v_bundle_raw_total := v_bundle_raw_total + v_product.price;
      else
        v_bundle_all_in_cart := false;
        exit;
      end if;
    end loop;

    v_bundle_count := coalesce(array_length(v_seen_bundle_ids, 1), 0);

    if v_bundle_all_in_cart and v_bundle_count >= 2 then
      -- Check custom fixed price for default bride bundle
      if v_bundle_custom_fixed > 0 and v_bundle_custom_fixed < v_bundle_raw_total and v_bundle_default_ids is not null and jsonb_typeof(v_bundle_default_ids) = 'array' and jsonb_array_length(v_bundle_default_ids) > 0 then
        if (
          v_bundle_count = jsonb_array_length(v_bundle_default_ids)
          and not exists (
            select 1
            from jsonb_array_elements_text(v_bundle_default_ids) elem
            where not (elem = any(v_seen_bundle_ids))
          )
        ) then
          v_is_default_bride := true;
          v_bundle_discount := greatest(0, v_bundle_raw_total - v_bundle_custom_fixed);
        end if;
      end if;

      if not v_is_default_bride then
        if v_bundle_count >= 4 then
          v_bundle_discount := round(v_bundle_raw_total * (v_bundle_tier4 / 100.0));
        elsif v_bundle_count = 3 then
          v_bundle_discount := round(v_bundle_raw_total * (v_bundle_tier3 / 100.0));
        elsif v_bundle_count = 2 then
          v_bundle_discount := round(v_bundle_raw_total * (v_bundle_tier2 / 100.0));
        end if;
      end if;
    end if;
  end if;

  -- Check Coupon Discount
  if p_coupon is not null and trim(p_coupon) <> '' then
    select *
    into v_coupon_record
    from public.coupons
    where code = upper(trim(p_coupon)) and is_active = true;

    if not found then
      v_coupon_message := 'كود الخصم غير صحيح أو غير متاح حالياً';
    elsif v_coupon_record.starts_at is not null and v_coupon_record.starts_at > now() then
      v_coupon_message := 'كود الخصم لم يبدأ تفعيله بعد';
    elsif v_coupon_record.expires_at is not null and v_coupon_record.expires_at < now() then
      v_coupon_message := 'انتهت صلاحية كود الخصم';
    elsif v_coupon_record.max_uses is not null and v_coupon_record.used_count >= v_coupon_record.max_uses then
      v_coupon_message := 'تم استنفاد الحد الأقصى لاستخدام كود الخصم';
    elsif v_subtotal < coalesce(v_coupon_record.min_order_total, 0) then
      v_coupon_message := format('الحد الأدنى لتفعيل الكود هو %s ج.م', v_coupon_record.min_order_total);
    else
      -- If coupon is linked to a bundle, verify bundle products (deduplicated)
      if v_coupon_record.bundle_ids is not null and jsonb_typeof(v_coupon_record.bundle_ids) = 'array' and jsonb_array_length(v_coupon_record.bundle_ids) > 0 then
        declare
          v_cid text;
          v_c_seen text[] := array[]::text[];
          v_c_ok boolean := true;
          v_b_val numeric(12,2) := 0;
        begin
          for v_cid in select jsonb_array_elements_text(v_coupon_record.bundle_ids) loop
            if v_cid = any(v_c_seen) then continue; end if;
            v_c_seen := array_append(v_c_seen, v_cid);
            if not (v_cid = any(v_cart_ids)) then v_c_ok := false; exit; end if;
            select price into v_product from public.products where id = v_cid and is_active = true;
            if found then v_b_val := v_b_val + v_product.price; else v_c_ok := false; exit; end if;
          end loop;

          if v_c_ok then
            if v_coupon_record.discount_type = 'fixed' then
              v_coupon_discount := least(v_coupon_record.discount_value, v_b_val);
            else
              v_coupon_discount := round(v_b_val * (v_coupon_record.discount_value / 100.0));
              if v_coupon_record.max_discount is not null and v_coupon_record.max_discount > 0 then
                v_coupon_discount := least(v_coupon_discount, v_coupon_record.max_discount);
              end if;
            end if;
            v_coupon_valid := true;
          else
            v_coupon_message := 'الكود مخصص لباكدج العروسة ويشترط وجود جميع أجهزة الباكدج بالسلة';
          end if;
        end;
      else
        -- Standard storewide coupon
        if v_coupon_record.discount_type = 'fixed' then
          v_coupon_discount := least(v_coupon_record.discount_value, v_subtotal);
        else
          v_coupon_discount := round(v_subtotal * (v_coupon_record.discount_value / 100.0));
          if v_coupon_record.max_discount is not null and v_coupon_record.max_discount > 0 then
            v_coupon_discount := least(v_coupon_discount, v_coupon_record.max_discount);
          end if;
        end if;
        v_coupon_valid := true;
      end if;
    end if;
  end if;

  -- Apply non-stacking rule: take the higher discount
  if v_bundle_discount > 0 and v_coupon_discount > 0 then
    if v_bundle_discount >= v_coupon_discount then
      v_effective_discount := v_bundle_discount;
      v_discount_type := 'bundle';
    else
      v_effective_discount := v_coupon_discount;
      v_discount_type := 'coupon';
    end if;
  elsif v_bundle_discount > 0 then
    v_effective_discount := v_bundle_discount;
    v_discount_type := 'bundle';
  elsif v_coupon_discount > 0 then
    v_effective_discount := v_coupon_discount;
    v_discount_type := 'coupon';
  else
    v_effective_discount := 0;
    v_discount_type := null;
  end if;

  -- Shipping is completely free to all Egypt governorates
  v_shipping := 0;
  v_final_total := greatest(0, (v_subtotal - v_effective_discount) + v_shipping);

  return jsonb_build_object(
    'subtotal', v_subtotal,
    'discount', v_effective_discount,
    'discount_type', v_discount_type,
    'coupon_code', case when v_discount_type = 'coupon' then upper(trim(p_coupon)) else null end,
    'coupon_discount', v_coupon_discount,
    'coupon_valid', v_coupon_valid,
    'coupon_message', v_coupon_message,
    'bundle_discount', v_bundle_discount,
    'shipping', v_shipping,
    'total', v_final_total,
    'total_count', v_total_count,
    'items', v_quoted_items
  );
end;
$$;

-- 5.2 create_order: Safe customer order submission RPC
-- Revalidates all prices/stock, enforces configurable rate limit, atomically decrements stock,
-- and writes order + items in a single transaction.
create or replace function public.create_order(
  p_customer jsonb,
  p_items jsonb,
  p_coupon text default null,
  p_bundle_ids jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_clean_name text;
  v_clean_phone text;
  v_clean_gov text;
  v_clean_address text;
  v_clean_notes text;
  v_payment_method text;
  v_transfer_ref text;
  v_screenshot_path text;

  v_settings jsonb := '{}'::jsonb;
  v_rate_limit_enabled boolean := true;
  v_rate_limit_max integer := 3;
  v_rate_limit_window_mins integer := 10;
  v_recent_orders_count integer;

  v_quote jsonb;
  v_subtotal numeric(12,2);
  v_discount numeric(12,2);
  v_discount_type text;
  v_shipping numeric(12,2);
  v_total numeric(12,2);

  v_order_id uuid;
  v_order_code text;
  v_quoted_item jsonb;

  v_headers_raw text;
  v_headers_json jsonb;
  v_forwarded_for text;
  v_client_ip inet := null;
  v_user_agent text := null;
begin
  -- 1. Validate customer details
  if p_customer is null or jsonb_typeof(p_customer) <> 'object' then
    raise exception 'بيانات العميل غير مكتملة';
  end if;

  v_clean_name := trim(coalesce(p_customer->>'customer', ''));
  v_clean_phone := trim(regexp_replace(coalesce(p_customer->>'phone', ''), '[^0-9]', '', 'g'));
  v_clean_gov := trim(coalesce(p_customer->>'gov', ''));
  v_clean_address := trim(coalesce(p_customer->>'address', ''));
  v_clean_notes := nullif(trim(coalesce(p_customer->>'notes', '')), '');
  v_payment_method := coalesce(nullif(trim(coalesce(p_customer->>'payment', '')), ''), 'الدفع عند الاستلام');
  v_transfer_ref := nullif(trim(coalesce(p_customer->>'transferRef', '')), '');
  v_screenshot_path := nullif(trim(coalesce(p_customer->>'paymentScreenshotPath', '')), '');

  if length(v_clean_name) < 2 then
    raise exception 'يرجى إدخال اسم العميل بالكامل (حرفان على الأقل)';
  end if;

  if v_clean_phone !~ '^01[0125][0-9]{8}$' then
    raise exception 'رقم الهاتف غير صحيح. يجب أن يكون رقم مصري يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقماً';
  end if;

  if length(v_clean_gov) < 2 then
    raise exception 'يرجى اختيار المحافظة';
  end if;

  if length(v_clean_address) < 5 then
    raise exception 'يرجى إدخال العنوان بالتفصيل (5 أحرف على الأقل)';
  end if;

  -- 2. Configurable Server-side Rate Limit (read from store_settings)
  select data into v_settings from public.store_settings where id = 'default';
  if v_settings is not null then
    v_rate_limit_enabled := coalesce((v_settings->>'rateLimitEnabled')::boolean, true);
    v_rate_limit_max := greatest(1, coalesce((v_settings->>'rateLimitMaxOrders')::integer, 3));
    v_rate_limit_window_mins := greatest(1, coalesce((v_settings->>'rateLimitWindowMinutes')::integer, 10));
  end if;

  if v_rate_limit_enabled then
    select count(*) into v_recent_orders_count
    from public.orders
    where phone = v_clean_phone
      and created_at >= (now() - make_interval(mins => v_rate_limit_window_mins));

    if v_recent_orders_count >= v_rate_limit_max then
      raise exception 'تم تجاوز الحد الأقصى للطلبات المسموح به (% طلبات خلال % دقيقة). يرجى الانتظار بضع دقائق أو التواصل مع خدمة العملاء عبر واتساب.', v_rate_limit_max, v_rate_limit_window_mins;
    end if;
  end if;

  -- 3. Calculate authoritative pricing and validate items/stock/bundles/coupons from DB
  v_quote := public.quote_cart(p_items, p_coupon, p_bundle_ids);

  v_subtotal := (v_quote->>'subtotal')::numeric;
  v_discount := (v_quote->>'discount')::numeric;
  v_discount_type := nullif(v_quote->>'discount_type', '');
  v_shipping := (v_quote->>'shipping')::numeric;
  v_total := (v_quote->>'total')::numeric;

  -- 4. Atomically lock and decrement stock for each ordered product
  for v_quoted_item in select value from jsonb_array_elements(v_quote->'items') order by (value->>'id') loop
    update public.products
    set
      stock_qty = stock_qty - (v_quoted_item->>'qty')::integer,
      in_stock = case when (stock_qty - (v_quoted_item->>'qty')::integer) > 0 then in_stock else false end
    where id = (v_quoted_item->>'id')
      and is_active = true
      and in_stock = true
      and stock_qty >= (v_quoted_item->>'qty')::integer;

    if not found then
      raise exception 'عذراً، نفدت الكمية المطلوبة من المنتج "%" أثناء إتمام الطلب.', (v_quoted_item->>'name');
    end if;
  end loop;

  -- 5. Extract client IP and user-agent safely if forwarded by PostgREST
  begin
    v_headers_raw := nullif(trim(current_setting('request.headers', true)), '');
    if v_headers_raw is not null then
      v_headers_json := v_headers_raw::jsonb;
      v_forwarded_for := nullif(trim(split_part(coalesce(v_headers_json->>'x-forwarded-for', ''), ',', 1)), '');
      if v_forwarded_for is not null then
        v_client_ip := inet(v_forwarded_for);
      end if;
      v_user_agent := nullif(trim(v_headers_json->>'user-agent'), '');
    end if;
  exception when others then
    v_client_ip := null;
    v_user_agent := null;
  end;

  -- 6. Insert into orders
  insert into public.orders (
    customer, phone, gov, address, notes,
    payment, transfer_ref, payment_screenshot_path,
    subtotal, discount, discount_type,
    coupon_code, coupon_discount,
    bundle_discount, bundle_ids,
    shipping, total, status,
    client_ip, user_agent
  )
  values (
    v_clean_name, v_clean_phone, v_clean_gov, v_clean_address, v_clean_notes,
    v_payment_method, v_transfer_ref, v_screenshot_path,
    v_subtotal, v_discount, v_discount_type,
    nullif(v_quote->>'coupon_code', ''), coalesce((v_quote->>'coupon_discount')::numeric, 0),
    coalesce((v_quote->>'bundle_discount')::numeric, 0), p_bundle_ids,
    v_shipping, v_total, 'جديد',
    v_client_ip, v_user_agent
  )
  returning id, order_code into v_order_id, v_order_code;

  -- 7. Insert line items
  for v_quoted_item in select value from jsonb_array_elements(v_quote->'items') loop
    insert into public.order_items (
      order_id, product_id, model, name, qty, unit_price, line_total, bundle_applied
    )
    values (
      v_order_id,
      nullif(v_quoted_item->>'id', ''),
      nullif(v_quoted_item->>'model', ''),
      v_quoted_item->>'name',
      (v_quoted_item->>'qty')::integer,
      (v_quoted_item->>'unit_price')::numeric,
      (v_quoted_item->>'line_total')::numeric,
      case when v_discount_type = 'bundle' and p_bundle_ids is not null and (p_bundle_ids ? (v_quoted_item->>'id')) then true else false end
    );
  end loop;

  -- 8. Increment coupon used count if a valid coupon was applied
  if v_discount_type = 'coupon' and (v_quote->>'coupon_code') is not null then
    update public.coupons
    set used_count = used_count + 1
    where code = v_quote->>'coupon_code';
  end if;

  -- 9. Add initial audit history record
  insert into public.order_status_history (order_id, old_status, new_status, note)
  values (v_order_id, null, 'جديد', 'إنشاء الطلب من المتجر بنجاح');

  return jsonb_build_object(
    'success', true,
    'id', v_order_id,
    'order_code', v_order_code,
    'customer', v_clean_name,
    'phone', v_clean_phone,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'discount_type', v_discount_type,
    'shipping', v_shipping,
    'total', v_total
  );
end;
$$;

-- ============================================================================
-- 6. STORAGE BUCKETS CONFIGURATION
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,
  10485760, -- 10 MB max per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880, -- 5 MB max per receipt image
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS Policies for product-media
drop policy if exists "public read product media" on storage.objects;
create policy "public read product media" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-media');

drop policy if exists "admins upload product media" on storage.objects;
create policy "admins upload product media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-media' and public.is_store_admin());

drop policy if exists "admins update product media" on storage.objects;
create policy "admins update product media" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-media' and public.is_store_admin());

drop policy if exists "admins delete product media" on storage.objects;
create policy "admins delete product media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-media' and public.is_store_admin());

-- Storage RLS Policies for payment-proofs (strictly scoped to receipts/ folder, no read for anon)
drop policy if exists "public upload payment proofs" on storage.objects;
create policy "public upload payment proofs" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = 'receipts'
    and position('..' in name) = 0
  );

drop policy if exists "admins read payment proofs" on storage.objects;
create policy "admins read payment proofs" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_store_admin());

drop policy if exists "admins delete payment proofs" on storage.objects;
create policy "admins delete payment proofs" on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment-proofs' and public.is_store_admin());

-- ============================================================================
-- 7. PERMISSIONS & GRANTS
-- ============================================================================

-- Functions: explicitly revoke from PUBLIC and anon on admin/trigger functions
revoke all on function public.quote_cart(jsonb, text, jsonb) from public;
grant execute on function public.quote_cart(jsonb, text, jsonb) to anon, authenticated;

revoke all on function public.create_order(jsonb, jsonb, text, jsonb) from public;
grant execute on function public.create_order(jsonb, jsonb, text, jsonb) to anon, authenticated;

revoke all on function public.is_store_admin() from public, anon;
grant execute on function public.is_store_admin() to authenticated;

revoke all on function public.is_store_super_admin() from public, anon;
grant execute on function public.is_store_super_admin() to authenticated;

revoke all on function public.log_order_status_change() from public, anon;
revoke all on function public.set_updated_at_column() from public, anon;
revoke all on function public.prevent_last_super_admin_removal() from public, anon;
revoke all on function public.protect_order_items() from public, anon;

-- Tables: Public read for storefront catalog & settings only
revoke all on public.admin_users, public.products, public.categories, public.hero_slides,
  public.store_settings, public.coupons, public.orders, public.order_items, public.order_status_history
  from anon, authenticated;

grant select on public.categories, public.products, public.hero_slides, public.store_settings
  to anon, authenticated;

-- Authenticated users have permissions checked against RLS
grant select on public.admin_users, public.order_status_history to authenticated;
grant insert, update, delete on public.admin_users to authenticated;
grant select, insert, update, delete on public.products, public.categories, public.hero_slides,
  public.store_settings, public.coupons, public.orders, public.order_items
  to authenticated;
