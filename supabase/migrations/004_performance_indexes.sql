-- 004_performance_indexes.sql
-- Indexes for the storefront's filter and sort paths:
--   * products.category  — category filtering
--   * products.price     — price filtering and price-asc/desc sorting
--   * products.created_at — newest-first sorting
--   * order_items.order_id / product_id — order + items joins

create index if not exists idx_products_category on public.products (category);
create index if not exists idx_products_price on public.products (price);
create index if not exists idx_products_created_at on public.products (created_at desc);
create index if not exists idx_products_category_price on public.products (category, price);
create index if not exists idx_order_items_order_id on public.order_items (order_id);
create index if not exists idx_order_items_product_id on public.order_items (product_id);
