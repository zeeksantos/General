import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AffiliatesTable } from "@/components/admin/affiliates-table";
import { TopVideos } from "@/components/dashboard/top-videos";
import { Notice } from "@/components/notice";
import { Card, CardContent } from "@/components/ui/card";
import { affiliateSummaries } from "@/lib/admin";
import { addDays, manilaDate } from "@/lib/dates";
import { loadAdminData, loadPendingCount } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { topVideos, type SortKey, type TopWindow } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { getViewer } from "@/lib/viewer";

export const metadata = { title: "Admin · Overview" };

const SYNC_MESSAGE: Record<string, string> = {
  ok: "Sync finished.",
  partial: "Sync ran but didn't finish in time; it continues on the next sync.",
  throttled: "Facebook asked us to slow down; it will retry automatically.",
  failed: "We couldn't start the sync.",
};

function Stat({ label, value, href, tone }: { label: string; value: number; href?: string; tone?: "bad" | "warn" }) {
  const body = (
    <Card className={cn(href && "transition-colors hover:bg-muted/50")}>
      <CardContent className="flex flex-col gap-1 p-4">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("text-2xl font-semibold tabular-nums", value > 0 && tone === "bad" && "text-destructive", value > 0 && tone === "warn" && "text-amber-600")}>
          {formatNumber(value)}
        </span>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{body}</Link> : body;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role !== "admin") notFound(); // RLS would hide the data anyway; don't reveal the page either

  const today = manilaDate(new Date());
  const platform = sp.platform === "facebook" || sp.platform === "instagram" ? sp.platform : "all";
  const top: TopWindow = sp.top === "week" || sp.top === "month" ? sp.top : "all";
  const sort: SortKey = sp.sort === "reach" ? "reach" : "views";
  const [{ profiles, connections, videos }, pending] = await Promise.all([loadAdminData(), loadPendingCount()]);

  const summaries = affiliateSummaries(profiles, connections, videos, { from: addDays(today, -29), to: today });
  const who = sp.who ? summaries.find((s) => s.profile.id === sp.who)?.profile : undefined;
  const attention = summaries.filter((s) => s.status === "needs_reconnect" || s.status === "never_synced").length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">All approved affiliates in one place. Dates are Philippine time.</p>
      </div>

      {sp.synced && (
        <Notice kind={sp.synced === "ok" ? "success" : sp.synced === "failed" ? "error" : "info"}>
          {who ? `${who.name || who.email}: ` : ""}{SYNC_MESSAGE[sp.synced] ?? SYNC_MESSAGE.failed}
        </Notice>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active affiliates" value={summaries.length} />
        <Stat label="Connected accounts" value={summaries.reduce((n, s) => n + s.accounts.length, 0)} />
        <Stat label="Need attention" value={attention} tone="bad" />
        <Stat label="Waiting for approval" value={pending} href="/admin/users" tone="warn" />
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="affiliates-heading">
        <div>
          <h2 id="affiliates-heading" className="text-lg font-semibold">Affiliates</h2>
          <p className="text-xs text-muted-foreground">
            Views and reach are for videos posted in the last 30 days. &ldquo;Last synced&rdquo; shows the oldest account.
          </p>
        </div>
        <AffiliatesTable rows={summaries} />
      </section>

      <TopVideos
        heading="Leaderboard: top videos across all affiliates"
        videos={topVideos(videos, { platform, window: top, sort, today, limit: 25 })}
        platform={platform} window={top} sort={sort} keep={{}}
        basePath="/admin" showAffiliate
      />
    </div>
  );
}
