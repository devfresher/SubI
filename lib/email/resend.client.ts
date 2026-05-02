import { Resend } from "resend";

let resend: Resend | null = null;

export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!resend) {
    resend = new Resend(key);
  }
  return resend;
}

export function reminderEmailHtml(params: {
  subscriptionName: string;
  nextBillingDate: string;
  manageUrl: string | null;
}): string {
  const { subscriptionName, nextBillingDate, manageUrl } = params;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;background:#f8fafc;font-family:system-ui,sans-serif;padding:24px;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <tr><td style="padding:24px 28px;background:#1E3A8A;color:#ffffff;">
      <h1 style="margin:0;font-size:20px;">SubI reminder</h1>
      <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">Upcoming subscription charge</p>
    </td></tr>
    <tr><td style="padding:28px;">
      <p style="margin:0 0 8px;font-size:16px;color:#0f172a;"><strong>${escapeHtml(subscriptionName)}</strong></p>
      <p style="margin:0;font-size:14px;color:#475569;">Next billing date: <strong style="color:#1E3A8A;">${escapeHtml(
        nextBillingDate,
      )}</strong></p>
      ${
        manageUrl
          ? `<p style="margin:24px 0 0;"><a href="${escapeAttr(
              manageUrl,
            )}" style="display:inline-block;background:#22C55E;color:#052e16;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Manage subscription</a></p>`
          : `<p style="margin:24px 0 0;font-size:13px;color:#F59E0B;">We could not find a manage link in the original email.</p>`
      }
    </td></tr>
  </table>
  <p style="text-align:center;font-size:12px;color:#64748b;margin-top:16px;">Sent by SubI</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
