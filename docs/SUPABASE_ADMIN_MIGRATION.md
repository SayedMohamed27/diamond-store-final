# Daimond Store — Supabase + Separate Admin Migration

## Audited current state
- Static HTML/CSS/JavaScript project; no root package.json or existing backend entry point.
- Current admin.html/admin.js are public repository files and have no enforced login.
- Catalog, categories, hero slides, settings, coupons and orders use browser localStorage; product videos use IndexedDB.
- Checkout writes orders to the current visitor's browser. Orders are therefore not centralized and the existing admin cannot reliably see all customers' orders.
- Initial searches did not find common Gemini/API-key markers or obvious password literals. This is not a full guarantee; run a dedicated secret scan including Git history before launch.

## Backup and branch safety
- Original main branch remains untouched.
- Backup branch: backup/pre-supabase-migration-2026-11-15
- Work branch: feature/supabase-admin-separation
- Do not merge until Supabase setup, migration, and end-to-end testing are complete.

## Target architecture
1. Existing public storefront, migrated gradually to Supabase reads and guest checkout RPC.
2. Independent admin app in admin-app/, deployed separately.
3. Supabase PostgreSQL, Auth, Row Level Security and private Storage.
4. Only publishable/anon key may be in browser config. Never expose service_role/secret key.

## Initial implementation
- admin-app/: independent login page using Supabase Auth, plus active admin_users allowlist check.
- admin-app/config.example.js: safe browser config template. Copy locally to ignored config.js.
- supabase/migrations/001_initial_schema.sql: tables, RLS policies, admin allowlist and guest order RPC.

## Supabase setup
1. Create a Supabase project.
2. Run supabase/migrations/001_initial_schema.sql in Supabase SQL Editor.
3. Create the first admin user in Supabase Authentication.
4. Copy that user's Auth UUID and insert it into public.admin_users:
   insert into public.admin_users (user_id, role, active) values ('AUTH-USER-UUID', 'super_admin', true);
5. Copy admin-app/config.example.js to admin-app/config.js locally and fill in project URL and publishable/anon key.
6. Deploy admin-app/ as a separate site and configure its URL in Supabase Auth URL settings.

## Remaining
- Import existing catalog/category/hero/settings without losing edits held in any browser localStorage.
- Build complete admin CRUD screens.
- Update storefront reads and checkout to Supabase; preserve guest checkout without public order reads.
- Add private Storage policies for payment screenshots and product media.
- Add rate limiting/abuse protection for public order creation.
- Complete secret scan, tests and staging deployment.
- Do not delete legacy admin.html until cutover is confirmed.
