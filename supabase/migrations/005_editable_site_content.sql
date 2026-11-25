-- ============================================================================
-- DIAMOND STORE - EDITABLE SITE CONTENT (MIGRATION 005)
-- Adds:
--   1. customer_reviews  - the "Diamond Store customer reviews" section cards
--   2. site_content      - key/value JSONB store for homepage sections
--                          (top bar lines, footer text, social links, shipping)
-- Sub-categories already live in categories.sub_items (JSONB) from 002, so
-- no new table is needed for them.
--
-- WHERE TO RUN:
--   Supabase Dashboard -> SQL Editor -> New query -> paste this whole file
--   -> Run. (Or: supabase db push, if CLI is linked.)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. CUSTOMER REVIEWS
-- ---------------------------------------------------------------------------
create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null default '',
  avatar_initials text not null default '',
  location_line text not null default '',
  review_text text not null default '',
  product_tag text not null default '',
  rating smallint not null default 5 check (rating between 1 and 5),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.customer_reviews is 'Editable customer reviews for the homepage reviews carousel. Public sees active ones; admins manage all.';

-- ---------------------------------------------------------------------------
-- 2. SITE CONTENT (key/value JSONB)
--    Keys used by the site today:
--      'topbar'       -> [{ "text": "...", "icon": "fa-truck-fast", "active": true }]
--      'footer'       -> { "about": "...", "note": "..." }
--      'social_links' -> [{ "label": "Facebook", "url": "https://...", "icon": "fa-facebook-f", "active": true }]
--      'shipping'     -> { "hero_badge": "...", "footer_note": "..." }
-- ---------------------------------------------------------------------------
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.site_content is 'Editable homepage section content (top bar, footer, social links, shipping text) keyed by section.';

-- Keep updated_at fresh on every edit.
create or replace function public.touch_site_content_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_site_content on public.site_content;
create trigger trg_touch_site_content
  before update on public.site_content
  for each row execute function public.touch_site_content_updated_at();

-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (same model as migration 002:
--    anon/authenticated = read-only, store admins = full control)
-- ---------------------------------------------------------------------------
alter table public.customer_reviews enable row level security;
alter table public.site_content enable row level security;

-- Explicit grants (RLS policies alone are not enough for direct table access)
grant select on public.customer_reviews to anon, authenticated;
grant insert, update, delete on public.customer_reviews to authenticated;
grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;

-- Reviews: public reads only active ones, admins read all
create policy "public read active reviews" on public.customer_reviews
  for select to anon
  using (is_active = true);

create policy "authenticated read reviews" on public.customer_reviews
  for select to authenticated
  using (true);

create policy "admins manage reviews" on public.customer_reviews
  for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

-- Site content: public read-only, admins manage
create policy "public read site content" on public.site_content
  for select to anon
  using (true);

create policy "authenticated read site content" on public.site_content
  for select to authenticated
  using (true);

create policy "admins manage site content" on public.site_content
  for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

-- ---------------------------------------------------------------------------
-- 4. SEED: initial rows so the site looks the same as today after the switch
--    (IDs are stable UUIDs so re-running is safe with ON CONFLICT DO NOTHING)
-- ---------------------------------------------------------------------------
insert into public.customer_reviews
  (id, author_name, avatar_initials, location_line, review_text, product_tag, rating, is_active, sort_order)
values
  ('a1000000-0000-4000-8000-000000000001', 'مدام أمنية طارق', 'أم',
   'مدينة نصر، القاهرة • عميلة موثقة',
   '"بجد والله القلاية الهوائية سوكاني الـ 8.5 لتر تحفة واختراع في البيت! وفرت عليا زيت كتير جداً والبطاطس والفراخ بتطلع مقرمشة ومستوية من جوه، والأوردر وصلني تاني يوم لحد باب البيت من غير ولا مليم شحن ومعاه ضمان معتمد رسمي من شركة المغربي لمدة سنة."',
   'قلاية سوكاني الديجيتال SK-10085', 5, true, 10),
  ('a1000000-0000-4000-8000-000000000002', 'أستاذ محمود عبد الله', 'م',
   'المنصورة، الدقهلية • عميل موثق',
   '"الخلاط الإصدار الاحترافي الزجاج ده أخطر حاجة اشتريتها! بيطحن كل حاجة في ثواني والزجاج تقيل وخفيف الصوت، والتغليف كان محترم جداً والشحن وصل في نفس اليوم. تعامل راقي جداً وأنصح بيه أي حد."',
   'خلاط سوكاني الإصدار الاحترافي', 5, true, 20),
  ('a1000000-0000-4000-8000-000000000003', 'د. هالة سمير', 'هـ',
   'سموحة، الإسكندرية • عميلة موثقة',
   '"ساندوتش ميكر سوكاني بيخلي الإفطار في المطعم بيتعمل في البيت! حرارة موزعة على الساندوتش بالتساوي وما بيحرقش أبداً، والتنظيف ثواني بالمسحة. ضمان سنة حقيقي ووثّقوه لي في الفاتورة والكرت."',
   'ساندوتش ميكر سوكاني 750 وات', 5, true, 30),
  ('a1000000-0000-4000-8000-000000000004', 'م. كريم فتحي', 'ك',
   'الشيخ زايد، الجيزة • عميل موثق',
   '"فرن سوكاني الكهربائي ده حجمه رياضي بجد، دخّلت فرخة كاملة وخضار جنبها ومشي عالطول! الحرارة مظبوطة والخارج ذهب مقرمش. أنا جربت أربع متاجر قبلهم ودي أنضف تجربة شراء على الإطلاق."',
   'فرن سوكاني الكهربائي 60 لتر', 5, true, 40),
  ('a1000000-0000-4000-8000-000000000005', 'مدا شيماء الصيفي', 'ش',
   'طنطا، الغربية • عميلة موثقة',
   '"الميكسر سوكاني بتاعهم بيتعامل مع العجين الثقيل من غير ما يحسس إنه مُقحوم! السرعات الخمس فعلاً فرق والشفرات ستانلس أصلية. الأوردر وصل ملفوف نضيف وبصيرة تدفئة حلوة، شكراً Diamond Store."',
   'ميكسر سوكاني 5 سرعات', 5, true, 50)
on conflict (id) do nothing;

insert into public.site_content (key, value) values
  ('topbar', '[
    {"text": "شحن مجاني تماماً لجميع محافظات مصر خلال 24 - 48 ساعة", "icon": "fa-truck-fast", "active": true},
    {"text": "ضمان معتمد رسمي من شركة المغربي لمدة سنة على جميع الأجهزة", "icon": "fa-shield-halved", "active": true},
    {"text": "خصم إضافي 10% باستخدام كود: DIAMOND10", "icon": "fa-tag", "active": true}
  ]'::jsonb),
  ('footer', '{"about": "كل منتجات سوكاني الأصلية في مكان واحد، وثقة أكتر من 50 ألف عميل في Diamond Store مع ضمان معتمد رسمي من شركة المغربي لمدة سنة وشحن مجاني لجميع المحافظات."}'::jsonb),
  ('social_links', '[
    {"label": "Facebook", "url": "https://www.facebook.com", "icon": "fa-facebook-f", "active": true},
    {"label": "Instagram", "url": "https://www.instagram.com", "icon": "fa-instagram", "active": true},
    {"label": "WhatsApp", "url": "", "icon": "fa-whatsapp", "active": true},
    {"label": "TikTok", "url": "https://www.tiktok.com", "icon": "fa-tiktok", "active": true}
  ]'::jsonb),
  ('shipping', '{"hero_badge": "شامل الشحن المجاني لباب المنزل", "note": "شحن مجاني لجميع المحافظات"}'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Indexes for fast public reads
-- ---------------------------------------------------------------------------
create index if not exists idx_customer_reviews_active
  on public.customer_reviews (sort_order, created_at)
  where is_active = true;
