import "server-only";

// Transactional email through Resend (https://resend.com). Optional: without RESEND_API_KEY and EMAIL_FROM
// nothing is sent and callers get { ok: false, reason: "not_configured" }. Sign-in/confirmation emails are
// sent by Supabase Auth, not by this helper.
export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export async function sendEmail(to: string, mail: { subject: string; text: string }): Promise<{ ok: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { ok: false, reason: "not_configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: mail.subject, text: mail.text }),
    });
    return res.ok ? { ok: true } : { ok: false, reason: `http_${res.status}` };
  } catch {
    return { ok: false, reason: "network" };
  }
}
