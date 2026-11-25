-- Product page tabs: technical specs, features, demo video.
alter table products add column if not exists specs jsonb not null default '{}'::jsonb;
alter table products add column if not exists features jsonb not null default '[]'::jsonb;
alter table products add column if not exists video_url text;
