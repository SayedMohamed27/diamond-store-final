-- Product gallery: jsonb array of image URLs (first entry mirrors the main image).
alter table products add column if not exists gallery jsonb not null default '[]'::jsonb;

-- Backfill existing rows so the gallery always starts with the main image.
update products
set gallery = jsonb_build_array(image)
where gallery = '[]'::jsonb
  and image is not null
  and image <> '';
