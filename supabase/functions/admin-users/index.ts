// Edge Function: admin-users
// Allows an active super_admin (verified from the caller's JWT) to manage
// admin users (Supabase Auth users + public.admin_users memberships) from
// the admin panel. Runs with the built-in service role key — the anon key
// alone can never create or edit auth users.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  // SERVICE_ROLE_KEY is set as a project secret (this project injects
  // SUPABASE_SERVICE_ROLE_KEY on some runtimes, so fall back to it).
  const serviceKey = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return json({ error: "Server misconfigured: missing service key" }, 500);
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Verify the caller is an authenticated, active super_admin.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing bearer token" }, 401);

  const { data: callerData, error: callerErr } = await admin.auth.getUser(token);
  const caller = callerData?.user;
  if (callerErr || !caller) return json({ error: "Invalid session" }, 401);

  const { data: membership, error: membershipErr } = await admin
    .from("admin_users")
    .select("role, active")
    .eq("user_id", caller.id)
    .maybeSingle();
  if (!membership?.active || membership.role !== "super_admin") {
    return json({ error: "غير مسموح — هذه العملية للمشرف الرئيسي فقط", debug_membership_error: membershipErr?.message ?? null }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const action = String(body.action ?? "");

  // 2. Dispatch.
  if (action === "list") {
    const { data: rows, error } = await admin
      .from("admin_users")
      .select("user_id, role, active, display_name, username, created_at, updated_at");
    if (error) return json({ error: error.message }, 500);

    const authUsers = new Map<string, { email: string | null; last_sign_in_at: string | null }>();
    let page = 1;
    for (;;) {
      const { data, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (listErr) return json({ error: listErr.message }, 500);
      for (const u of data.users) authUsers.set(u.id, { email: u.email ?? null, last_sign_in_at: u.last_sign_in_at ?? null });
      if (data.users.length < 200) break;
      page++;
    }

    const users = (rows ?? []).map((r) => ({
      ...r,
      username: r.username ?? usernameOf(authUsers.get(r.user_id)?.email),
      email: authUsers.get(r.user_id)?.email ?? null,
      last_sign_in_at: authUsers.get(r.user_id)?.last_sign_in_at ?? null,
    }));
    return json({ users });
  }

  // The login screen only collects a username; Supabase Auth stores it as
  // <username>@admin.diamondstore.local.
  const AUTH_EMAIL_DOMAIN = "@admin.diamondstore.local";
  const usernameOf = (email: string | null | undefined): string | null =>
    email && email.endsWith(AUTH_EMAIL_DOMAIN)
      ? email.slice(0, -AUTH_EMAIL_DOMAIN.length)
      : (email?.split("@")[0] ?? null);

  if (action === "create") {
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const displayName = String(body.display_name ?? "").trim() || null;
    const role = body.role === "super_admin" ? "super_admin" : "admin";

    if (!/^[a-z0-9._-]{3,30}$/.test(username)) return json({ error: "اسم المستخدم يجب أن يكون 3-30 حرفًا إنجليزيًا (أرقام و . _ - مسموحة)" }, 400);
    if (password.length < 8) return json({ error: "كلمة المرور يجب ألا تقل عن 8 أحرف" }, 400);

    const email = username + AUTH_EMAIL_DOMAIN;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (createErr) return json({ error: createErr.message }, 400);

    const { error: insertErr } = await admin
      .from("admin_users")
      .insert({ user_id: created.user!.id, role, active: true, display_name: displayName, username });
    if (insertErr) {
      await admin.auth.admin.deleteUser(created.user!.id);
      return json({ error: insertErr.message }, 500);
    }
    return json({ user: { user_id: created.user!.id, username, email, role, active: true, display_name: displayName } }, 201);
  }

  if (action === "update") {
    const userId = String(body.user_id ?? "");
    if (!userId) return json({ error: "user_id مطلوب" }, 400);

    const password = body.password === undefined ? null : String(body.password);
    if (password !== null && password !== "" && password.length < 8) {
      return json({ error: "كلمة المرور يجب ألا تقل عن 8 أحرف" }, 400);
    }

    let newUsername: string | null = null;
    if (body.username !== undefined) {
      newUsername = String(body.username).trim().toLowerCase();
      if (!/^[a-z0-9._-]{3,30}$/.test(newUsername)) return json({ error: "اسم المستخدم يجب أن يكون 3-30 حرفًا إنجليزيًا (أرقام و . _ - مسموحة)" }, 400);
    }

    const authUpdate: Record<string, unknown> = {};
    if (password) authUpdate.password = password;
    if (newUsername) authUpdate.email = newUsername + AUTH_EMAIL_DOMAIN;
    if (body.display_name !== undefined) authUpdate.user_metadata = { display_name: String(body.display_name).trim() };
    if (Object.keys(authUpdate).length) {
      const { error } = await admin.auth.admin.updateUserById(userId, authUpdate);
      if (error) return json({ error: error.message }, 400);
    }

    const dbUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (newUsername) dbUpdate.username = newUsername;
    if (body.display_name !== undefined) dbUpdate.display_name = String(body.display_name).trim() || null;
    if (body.role !== undefined) dbUpdate.role = body.role === "super_admin" ? "super_admin" : "admin";
    if (body.active !== undefined) dbUpdate.active = Boolean(body.active);

    if (dbUpdate.active === false || dbUpdate.role === "admin") {
      const { data: target } = await admin.from("admin_users").select("role, active").eq("user_id", userId).maybeSingle();
      if (target?.role === "super_admin" && target.active) {
        const { count } = await admin
          .from("admin_users")
          .select("*", { count: "exact", head: true })
          .eq("role", "super_admin")
          .eq("active", true);
        if ((count ?? 0) <= 1) return json({ error: "لا يمكن تعطيل أو تخفيض آخر مشرف رئيسي نشط" }, 400);
      }
    }

    const { error } = await admin.from("admin_users").update(dbUpdate).eq("user_id", userId);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  if (action === "delete") {
    const userId = String(body.user_id ?? "");
    if (!userId) return json({ error: "user_id مطلوب" }, 400);
    if (userId === caller.id) return json({ error: "لا يمكنك حذف حسابك الحالي" }, 400);

    const { data: target } = await admin.from("admin_users").select("role, active").eq("user_id", userId).maybeSingle();
    if (target?.role === "super_admin") {
      const { count } = await admin
        .from("admin_users")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_admin")
        .eq("active", true);
      if ((count ?? 0) <= 1) return json({ error: "لا يمكن حذف آخر مشرف رئيسي نشط" }, 400);
    }

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  return json({ error: "Unknown action" }, 400);
});
