-- ============================================================================
-- 006: Admin login by USERNAME
-- Admins sign in with a username; the panel maps it to the internal email
--   <username>@admin.diamondstore.local
-- which is the real email stored in Supabase Auth. Existing admins are
-- migrated automatically (username taken from the first part of their email).
-- The admin_users membership check (by user_id) is untouched.
-- Run with:  supabase db push --remote --yes   (or paste into SQL Editor)
-- ============================================================================

-- 1. Add a unique username column to admin_users
alter table public.admin_users add column if not exists username text;
create unique index if not exists admin_users_username_key on public.admin_users (lower(username)) where username is not null;

-- 2. Fill usernames from each admin's current auth email (part before @)
update public.admin_users au
set username = lower(split_part(u.email, '@', 1))
from auth.users u
where au.user_id = u.id
  and au.username is null;

alter table public.admin_users alter column username set not null;

-- 3. Move every admin's Supabase Auth email to the internal domain
--    (this is what makes <username>@admin.diamondstore.local a real login).
--    Keep their original email in raw_user_meta_data for reference.
update auth.users u
set email = lower(split_part(u.email, '@', 1)) || '@admin.diamondstore.local',
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('previous_email', u.email),
    updated_at = now()
where u.id in (select user_id from public.admin_users)
  and u.email not like '%@admin.diamondstore.local';

--    auth.identities.email is generated from auth.users.email and updates
--    itself; do not write to it directly.

-- 4. Guard: usernames are English letters/digits/._- , 3-30 chars
create or replace function public.validate_admin_username()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.username is null or new.username !~ '^[A-Za-z0-9._-]{3,30}$' then
    raise exception 'اسم المستخدم يجب أن يكون 3-30 حرفًا إنجليزيًا (أرقام و . _ - مسموحة)';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_admin_username on public.admin_users;
create trigger trg_validate_admin_username
  before insert or update of username on public.admin_users
  for each row execute function public.validate_admin_username();
