// Pure builders for the plain-text emails. Sending lives in lib/email.ts.
import { isProblem, type SyncRun } from "./sync-log.ts";

export type Mail = { subject: string; text: string };
const platformLabel = (p: string) => (p === "instagram" ? "Instagram" : "Facebook Page");

export function reconnectEmail(accounts: { platform: string; account_name: string }[], siteUrl: string): Mail {
  const list = accounts.map((a) => `- ${a.account_name} (${platformLabel(a.platform)})`).join("\n");
  return {
    subject: "Please reconnect your account to keep your stats updating",
    text:
      `Hi,\n\nFacebook told us we can no longer read data from:\n\n${list}\n\n` +
      `Your existing numbers are safe, but they will stop updating until you reconnect. It takes about a minute:\n` +
      `1. Open ${siteUrl}/dashboard\n2. Press "Reconnect or add another Page" and approve the Facebook dialog.\n\n` +
      `Z-Fast Affiliate Dashboard`,
  };
}

export function approvedEmail(name: string, siteUrl: string): Mail {
  return {
    subject: "Your Affiliate Dashboard account is approved",
    text:
      `Hi${name ? ` ${name}` : ""},\n\nYour account has been approved. Sign in and connect your Facebook Page and Instagram ` +
      `account to see which of your videos perform best:\n\n${siteUrl}/login\n\nZ-Fast Affiliate Dashboard`,
  };
}

export function adminDigestEmail(
  input: { runs: SyncRun[]; pendingCount: number },
  siteUrl: string,
): Mail | null {
  const problems = input.runs.filter((r) => isProblem(r.status));
  if (problems.length === 0 && input.pendingCount === 0) return null;

  const lines: string[] = [];
  if (input.pendingCount > 0) {
    lines.push(`${input.pendingCount} ${input.pendingCount === 1 ? "account is" : "accounts are"} waiting for approval: ${siteUrl}/admin/users`);
  }
  if (problems.length > 0) {
    lines.push(`${problems.length} sync ${problems.length === 1 ? "problem" : "problems"} in the last 24 hours (${siteUrl}/admin/sync-log):`);
    for (const r of problems.slice(0, 15)) {
      const who = r.profile_name || "Unknown";
      const what = r.account_name ? `${r.account_name} (${r.platform ?? "?"})` : (r.platform ?? "account");
      const note = r.warnings?.[0] ? ` — ${String(r.warnings[0]).slice(0, 120)}` : "";
      lines.push(`  • ${who}, ${what}: ${r.status}${note}`);
    }
    if (problems.length > 15) lines.push(`  …and ${problems.length - 15} more.`);
  }
  return { subject: "Affiliate Dashboard: daily summary", text: `${lines.join("\n")}\n\nZ-Fast Affiliate Dashboard` };
}
