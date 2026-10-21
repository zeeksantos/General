import Link from "next/link";
import { formatDate, formatNumber } from "@/lib/format";
import { whyItWorked, type SortKey, type TopWindow, type VideoStat } from "@/lib/stats";
import { cn } from "@/lib/utils";

const PLATFORMS = [["all", "All"], ["facebook", "Facebook"], ["instagram", "Instagram"]] as const;
const WINDOWS: [TopWindow, string][] = [["week", "This week"], ["month", "This month"], ["all", "All time"]];
const SORTS: [SortKey, string][] = [["views", "Views"], ["reach", "Reach"]];

function Pills({ items, active, href }: { items: readonly (readonly [string, string])[]; active: string; href: (v: string) => string }) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5 text-sm">
      {items.map(([value, label]) => (
        <Link key={value} href={href(value)} className={cn("rounded px-3 py-1", active === value ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
          {label}
        </Link>
      ))}
    </div>
  );
}

function PlatformBadge({ platform }: { platform: VideoStat["platform"] }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium text-white", platform === "facebook" ? "bg-[#2563eb]" : "bg-[#db2777]")}>
      {platform === "facebook" ? "Facebook" : "Instagram"}
    </span>
  );
}

export function TopVideos({
  videos, platform, window, sort, keep,
}: {
  videos: VideoStat[];
  platform: string;
  window: TopWindow;
  sort: SortKey;
  keep: Record<string, string>; // other query params to preserve (e.g. the KPI period)
}) {
  const href = (extra: Record<string, string>) =>
    `/dashboard?${new URLSearchParams({ ...keep, platform, top: window, sort, ...extra })}`;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="top-videos-heading">
      <h2 id="top-videos-heading" className="text-lg font-semibold">Top videos</h2>
      <div className="flex flex-wrap items-center gap-3">
        <Pills items={PLATFORMS} active={platform} href={(v) => href({ platform: v })} />
        <Pills items={WINDOWS} active={window} href={(v) => href({ top: v })} />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sort by</span>
          <Pills items={SORTS} active={sort} href={(v) => href({ sort: v })} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Videos posted in the chosen window. &ldquo;All time&rdquo; covers the last 90 days. Weeks start on Monday.
      </p>

      {videos.length === 0 ? (
        <p className="rounded-md border border-border p-4 text-sm text-muted-foreground">
          No videos here yet. Try a wider window, or press &ldquo;Sync now&rdquo; if you just connected.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Video</th>
                <th className="p-3">Posted</th>
                <th className="p-3 text-right">Views</th>
                <th className="p-3 text-right">Reach</th>
                <th className="p-3 text-right">Link clicks</th>
                <th className="p-3"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => {
                const why = whyItWorked(v);
                return (
                  <tr key={v.id} className="border-t border-border align-top">
                    <td className="p-3">
                      <div className="flex gap-3">
                        {v.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- remote Meta CDN URLs, not optimizable
                          <img src={v.thumbnail_url} alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-md bg-muted object-cover" />
                        ) : (
                          <div className="h-16 w-16 shrink-0 rounded-md bg-muted" aria-hidden />
                        )}
                        <div className="flex min-w-0 max-w-xs flex-col gap-1">
                          <PlatformBadge platform={v.platform} />
                          <span className="line-clamp-2">{why.hook}</span>
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground">Why it worked</summary>
                            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                              <dt className="text-muted-foreground">Hook</dt><dd>{why.hook}</dd>
                              <dt className="text-muted-foreground">Length</dt><dd>{why.length}</dd>
                              <dt className="text-muted-foreground">Format</dt><dd>{why.format}</dd>
                              <dt className="text-muted-foreground">Posted</dt><dd>{why.posted}</dd>
                            </dl>
                          </details>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">{formatDate(v.published_at)}</td>
                    <td className="p-3 text-right tabular-nums">{formatNumber(v.views)}</td>
                    <td className="p-3 text-right tabular-nums">{formatNumber(v.reach)}</td>
                    <td className="p-3 text-right tabular-nums">
                      {v.platform === "instagram" ? <span title="Instagram doesn't report link clicks per video">—</span> : formatNumber(v.link_clicks)}
                    </td>
                    <td className="p-3">
                      {v.permalink && (
                        <a href={v.permalink} target="_blank" rel="noopener noreferrer" className="underline">
                          View post<span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
