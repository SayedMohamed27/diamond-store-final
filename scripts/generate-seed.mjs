import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const projectRoot = process.cwd();
const productsJsPath = path.join(projectRoot, 'products.js');
const outputSqlPath = path.join(projectRoot, 'supabase', 'migrations', '003_seed_catalog.sql');

if (!fs.existsSync(productsJsPath)) {
  console.error(`Cannot find products.js at ${productsJsPath}`);
  process.exit(1);
}

// Load products.js in a safe sandbox to extract default definitions
const code = fs.readFileSync(productsJsPath, 'utf8') + `
;globalThis.__SEED_DATA__ = {
  DEFAULT_STORE_SETTINGS,
  DEFAULT_CATEGORIES,
  DEFAULT_HERO_SLIDES,
  DEFAULT_PRODUCTS
};`;

const sandbox = {
  window: {},
  document: null,
  localStorage: {
    getItem: () => null,
    setItem: () => null
  }
};
sandbox.globalThis = sandbox;

vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const {
  DEFAULT_STORE_SETTINGS,
  DEFAULT_CATEGORIES,
  DEFAULT_HERO_SLIDES,
  DEFAULT_PRODUCTS
} = sandbox.__SEED_DATA__;

console.log(`Loaded from products.js:`);
console.log(`- Categories: ${DEFAULT_CATEGORIES.length}`);
console.log(`- Products: ${DEFAULT_PRODUCTS.length}`);
console.log(`- Hero Slides: ${DEFAULT_HERO_SLIDES.length}`);

function escapeSqlString(str) {
  if (str === null || str === undefined) return 'null';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function escapeSqlJson(obj) {
  if (obj === null || obj === undefined) return "'{}'::jsonb";
  const jsonStr = JSON.stringify(obj);
  return `'${jsonStr.replace(/'/g, "''")}'::jsonb`;
}

const sqlLines = [];

sqlLines.push(`-- ============================================================================`);
sqlLines.push(`-- DAIMOND STORE - INITIAL SEED CATALOG (MIGRATION 003)`);
sqlLines.push(`-- Auto-generated from products.js`);
sqlLines.push(`-- Safe & Idempotent: Uses ON CONFLICT DO UPDATE for all catalog entities`);
sqlLines.push(`-- ============================================================================\n`);

// 1. Store Settings
sqlLines.push(`-- 1. Store Settings`);
sqlLines.push(`insert into public.store_settings (id, data)`);
sqlLines.push(`values ('default', ${escapeSqlJson(DEFAULT_STORE_SETTINGS)})`);
sqlLines.push(`on conflict (id) do update set`);
sqlLines.push(`  data = excluded.data,`);
sqlLines.push(`  updated_at = now();\n`);

// 2. Categories
sqlLines.push(`-- 2. Categories (4 Core Categories)`);
DEFAULT_CATEGORIES.forEach((cat, idx) => {
  const id = escapeSqlString(cat.id);
  const name = escapeSqlString(cat.name);
  const navTitle = escapeSqlString(cat.navTitle || cat.name);
  const enName = escapeSqlString(cat.enName || '');
  const subtitle = escapeSqlString(cat.subtitle || '');
  const icon = escapeSqlString(cat.icon || 'fa-tag');
  const image = escapeSqlString(cat.image || '');
  const subItems = escapeSqlJson(cat.subItems || []);
  const sortOrder = idx + 1;

  sqlLines.push(`insert into public.categories (id, name, nav_title, en_name, subtitle, icon, image, sub_items, sort_order, is_active)`);
  sqlLines.push(`values (${id}, ${name}, ${navTitle}, ${enName}, ${subtitle}, ${icon}, ${image}, ${subItems}, ${sortOrder}, true)`);
  sqlLines.push(`on conflict (id) do update set`);
  sqlLines.push(`  name = excluded.name,`);
  sqlLines.push(`  nav_title = excluded.nav_title,`);
  sqlLines.push(`  en_name = excluded.en_name,`);
  sqlLines.push(`  subtitle = excluded.subtitle,`);
  sqlLines.push(`  icon = excluded.icon,`);
  sqlLines.push(`  image = excluded.image,`);
  sqlLines.push(`  sub_items = excluded.sub_items,`);
  sqlLines.push(`  sort_order = excluded.sort_order,`);
  sqlLines.push(`  is_active = excluded.is_active,`);
  sqlLines.push(`  updated_at = now();\n`);
});

// 3. Products
sqlLines.push(`-- 3. Products (${DEFAULT_PRODUCTS.length} Official SOKANY Products)`);
DEFAULT_PRODUCTS.forEach((p, idx) => {
  const id = escapeSqlString(p.id);
  const model = escapeSqlString(p.model || '');
  const name = escapeSqlString(p.name);
  const category = escapeSqlString(p.category || 'kitchen');
  const categoryLabel = escapeSqlString(p.categoryLabel || '');
  const wattage = escapeSqlString(p.wattage || '');
  const capacity = escapeSqlString(p.capacity || '');
  const warranty = escapeSqlString(p.warranty || 'ضمان معتمد رسمي من شركة المغربي لمدة سنة');
  const shipping = escapeSqlString(p.shipping || 'شحن مجاني لجميع المحافظات');
  const price = Number(p.price) || 0;
  const oldPrice = p.oldPrice ? Number(p.oldPrice) : 'null';
  const rating = Number(p.rating) || 4.8;
  const reviewsCount = Number(p.reviewsCount) || 0;
  const badge = escapeSqlString(p.badge || '');
  const inStock = p.inStock !== false;
  const stockQty = 100;
  const image = escapeSqlString(p.image || '');
  const gallery = escapeSqlJson(p.gallery || [p.image]);
  const fallbackImage = escapeSqlString(p.fallbackImage || '');
  const shortDesc = escapeSqlString(p.shortDesc || '');
  const specs = escapeSqlJson(p.specs || {});
  const features = escapeSqlJson(p.features || []);
  const sortOrder = idx + 1;

  sqlLines.push(`insert into public.products (`);
  sqlLines.push(`  id, model, name, category, category_label, wattage, capacity, warranty, shipping,`);
  sqlLines.push(`  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,`);
  sqlLines.push(`  fallback_image, short_desc, specs, features, is_active, sort_order`);
  sqlLines.push(`) values (`);
  sqlLines.push(`  ${id}, ${model}, ${name}, ${category}, ${categoryLabel}, ${wattage}, ${capacity}, ${warranty}, ${shipping},`);
  sqlLines.push(`  ${price}, ${oldPrice}, ${rating}, ${reviewsCount}, ${badge}, ${inStock}, ${stockQty}, ${image}, ${gallery},`);
  sqlLines.push(`  ${fallbackImage}, ${shortDesc}, ${specs}, ${features}, true, ${sortOrder}`);
  sqlLines.push(`) on conflict (id) do update set`);
  sqlLines.push(`  model = excluded.model,`);
  sqlLines.push(`  name = excluded.name,`);
  sqlLines.push(`  category = excluded.category,`);
  sqlLines.push(`  category_label = excluded.category_label,`);
  sqlLines.push(`  wattage = excluded.wattage,`);
  sqlLines.push(`  capacity = excluded.capacity,`);
  sqlLines.push(`  warranty = excluded.warranty,`);
  sqlLines.push(`  shipping = excluded.shipping,`);
  sqlLines.push(`  price = excluded.price,`);
  sqlLines.push(`  old_price = excluded.old_price,`);
  sqlLines.push(`  rating = excluded.rating,`);
  sqlLines.push(`  reviews_count = excluded.reviews_count,`);
  sqlLines.push(`  badge = excluded.badge,`);
  sqlLines.push(`  in_stock = excluded.in_stock,`);
  sqlLines.push(`  image = excluded.image,`);
  sqlLines.push(`  gallery = excluded.gallery,`);
  sqlLines.push(`  fallback_image = excluded.fallback_image,`);
  sqlLines.push(`  short_desc = excluded.short_desc,`);
  sqlLines.push(`  specs = excluded.specs,`);
  sqlLines.push(`  features = excluded.features,`);
  sqlLines.push(`  sort_order = excluded.sort_order,`);
  sqlLines.push(`  updated_at = now();\n`);
});

// 4. Hero Slides
sqlLines.push(`-- 4. Hero Slides Showcase (${DEFAULT_HERO_SLIDES.length} Featured Slides)`);
DEFAULT_HERO_SLIDES.forEach((s, idx) => {
  const id = escapeSqlString(`hero-${s.num || String(idx + 1).padStart(2, '0')}`);
  const num = escapeSqlString(s.num || String(idx + 1).padStart(2, '0'));
  const tag = escapeSqlString(s.tag || '');
  const title = escapeSqlString(s.title || '');
  const subtitle = escapeSqlString(s.subtitle || '');
  const model = escapeSqlString(s.model || '');
  const power = escapeSqlString(s.power || '');
  const capacity = escapeSqlString(s.capacity || '');
  const price = escapeSqlString(s.price || '');
  const image = escapeSqlString(s.image || '');
  const fitMode = escapeSqlString(s.fitMode || 'contain');
  const productId = escapeSqlString(s.productId || null);
  const categoryId = escapeSqlString(s.categoryId || null);
  const sortOrder = idx + 1;

  sqlLines.push(`insert into public.hero_slides (`);
  sqlLines.push(`  id, num, tag, title, subtitle, model, power, capacity, price, image, fit_mode, product_id, category_id, sort_order, is_active`);
  sqlLines.push(`) values (`);
  sqlLines.push(`  ${id}, ${num}, ${tag}, ${title}, ${subtitle}, ${model}, ${power}, ${capacity}, ${price}, ${image}, ${fitMode}, ${productId}, ${categoryId}, ${sortOrder}, true`);
  sqlLines.push(`) on conflict (id) do update set`);
  sqlLines.push(`  num = excluded.num,`);
  sqlLines.push(`  tag = excluded.tag,`);
  sqlLines.push(`  title = excluded.title,`);
  sqlLines.push(`  subtitle = excluded.subtitle,`);
  sqlLines.push(`  model = excluded.model,`);
  sqlLines.push(`  power = excluded.power,`);
  sqlLines.push(`  capacity = excluded.capacity,`);
  sqlLines.push(`  price = excluded.price,`);
  sqlLines.push(`  image = excluded.image,`);
  sqlLines.push(`  fit_mode = excluded.fit_mode,`);
  sqlLines.push(`  product_id = excluded.product_id,`);
  sqlLines.push(`  category_id = excluded.category_id,`);
  sqlLines.push(`  sort_order = excluded.sort_order,`);
  sqlLines.push(`  is_active = excluded.is_active,`);
  sqlLines.push(`  updated_at = now();\n`);
});

// 5. Default Coupons
sqlLines.push(`-- 5. Default Discount Coupons`);
const defaultCoupons = [
  { code: 'DAIMOND10', type: 'percent', val: 10, min: 0 },
  { code: 'SOKANY15', type: 'percent', val: 15, min: 2000 },
  { code: 'BRIDE25', type: 'percent', val: 25, min: 5000 }
];

defaultCoupons.forEach(c => {
  const code = escapeSqlString(c.code);
  const type = escapeSqlString(c.type);
  const val = c.val;
  const min = c.min;

  sqlLines.push(`insert into public.coupons (code, discount_type, discount_value, min_order_total, is_active)`);
  sqlLines.push(`values (${code}, ${type}, ${val}, ${min}, true)`);
  sqlLines.push(`on conflict (code) do update set`);
  sqlLines.push(`  discount_type = excluded.discount_type,`);
  sqlLines.push(`  discount_value = excluded.discount_value,`);
  sqlLines.push(`  min_order_total = excluded.min_order_total,`);
  sqlLines.push(`  is_active = excluded.is_active,`);
  sqlLines.push(`  updated_at = now();\n`);
});

fs.writeFileSync(outputSqlPath, sqlLines.join('\n'), 'utf8');
console.log(`Successfully generated seed SQL migration at:\n${outputSqlPath}`);
