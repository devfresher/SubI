import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const BATCH = 25;
const MAX_ATTEMPTS = 2;

function html(params: {
  name: string;
  date: string;
  url: string | null;
}): string {
  const { name, date, url } = params;
  return `<!DOCTYPE html><html><body style="margin:0;background:#f8fafc;font-family:system-ui,sans-serif;padding:24px">
  <table style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0">
    <tr><td style="padding:24px;background:#1E3A8A;color:#fff"><h1 style="margin:0;font-size:20px">SubI reminder</h1></td></tr>
    <tr><td style="padding:28px">
      <p style="margin:0"><strong>${escape(name)}</strong></p>
      <p style="margin:12px 0 0">Next billing: <strong style="color:#1E3A8A">${escape(date)}</strong></p>
      ${
        url
          ? `<p style="margin:24px 0 0"><a href="${escapeAttr(url)}" style="background:#22C55E;color:#052e16;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Manage subscription</a></p>`
          : ""
      }
    </td></tr>
  </table></body></html>`;
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escape(s).replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM");

  if (!supabaseUrl || !serviceKey || !resendKey || !from) {
    return new Response("Missing env", { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const nowIso = new Date().toISOString();

  const { data: notifications, error: nErr } = await admin
    .from("notifications")
    .select("*")
    .eq("status", "pending")
    .lte("notify_at", nowIso)
    .lt("attempt_count", MAX_ATTEMPTS)
    .order("notify_at", { ascending: true })
    .limit(BATCH);

  if (nErr) {
    console.error(nErr);
    return new Response("DB error", { status: 500 });
  }

  let sent = 0;
  for (const n of notifications ?? []) {
    const { data: userRow } = await admin.from("users").select("email").eq("id", n.user_id).maybeSingle();
    const email = userRow?.email as string | undefined;
    if (!email) {
      await admin
        .from("notifications")
        .update({
          status: "failed",
          attempt_count: n.attempt_count + 1,
          last_attempt_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", n.id);
      continue;
    }

    const { data: sub } = await admin
      .from("subscriptions")
      .select("name, next_billing_date, cancel_url")
      .eq("id", n.subscription_id)
      .maybeSingle();

    if (!sub) {
      await admin
        .from("notifications")
        .update({ status: "failed", last_attempt_at: nowIso, updated_at: nowIso })
        .eq("id", n.id);
      continue;
    }

    const nextAttempt = n.attempt_count + 1;
    const body = {
      from,
      to: email,
      subject: `Reminder: ${sub.name as string}`,
      html: html({
        name: sub.name as string,
        date: String(sub.next_billing_date),
        url: (sub.cancel_url as string | null) ?? null,
      }),
    };

    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        throw new Error(await r.text());
      }
      const json = (await r.json()) as { id?: string };
      await admin
        .from("notifications")
        .update({
          status: "sent",
          attempt_count: nextAttempt,
          last_attempt_at: nowIso,
          provider_message_id: json.id ?? null,
          updated_at: nowIso,
        })
        .eq("id", n.id);
      sent += 1;
    } catch (e) {
      console.error(e);
      const failed = nextAttempt >= MAX_ATTEMPTS;
      await admin
        .from("notifications")
        .update({
          status: failed ? "failed" : "pending",
          attempt_count: nextAttempt,
          last_attempt_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", n.id);
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: notifications?.length ?? 0, sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
