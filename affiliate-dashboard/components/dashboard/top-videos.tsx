import Link from "next/link";
import { formatDate, formatNumber } from "@/lib/format";
import { whyItWorked, type SortKey, type TopWindow, type VideoStat } from "@/lib/stats";
import { cn } from "@/lib/utils";

const PLATFORMS = [["all", "All"], ["facebook", "Facebook"], ["instagram", "Instagram"]] as const;
const WINDOWS: [TopWindow, string][] = [["week", "This week"], ["month", "This month"], ["all", "All time"]];
const SORTS: [SortKey, string][] = [["views", "Views"], ["reach", "Reach"]];

function Pills({ label, items, active, href }: { label: string; items: readonly (readonly [string, string])[]; active: string; href: (v: string) => string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md border border-border p-0.5 text-sm">
      {items.map(([value, text]) => (
        <Link
          key={value}
          href={href(value)}
          aria-current={active === value ? "true" : undefined}
          className={cn("rounded px-3 py-1.5", active === value ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
        >
          {text}
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

function Thumb({ url, size }: { url: string | null; size: number }) {
  const cls = "shrink-0 rounded-md bg-muted object-cover";
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- remote Meta CDN URLs, not optimizable
    <img src={url} alt="" width={size} height={size} className={cls} style={{ width: size, height: size }} />
  ) : (
    <div className={cls} style={{ width: size, height: size }} aria-hidden />
  );
}

function Why({ v }: { v: VideoStat }) {
  const why = whyItWorked(v);
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Why it worked</summary>
      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
        <dt className="text-muted-foreground">Hook</dt><dd>{why.hook}</dd>
        <dt className="text-muted-foreground">Length</dt><dd>{why.length}</dd>
        <dt className="text-muted-foreground">Format</dt><dd>{why.format}</dd>
        <dt className="text-muted-foreground">Posted</dt><dd>{why.posted}</dd>
      </dl>
    </details>
  );
}

const Link_ = ({ v }: { v: VideoStat }) =>
  v.permalink ? (
    <a href={v.permalink} target="_blank" rel="noopener noreferrer" className="underline">
      View post<span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : null;

const clicks = (v: VideoStat) =>
  v.platform === "instagram" ? <span title="Instagram doesn't report link clicks per video">—</span> : formatNumber(v.link_clicks);

export function TopVideos({
  videos, platform, window, sort, keep, basePath = "/dashboard", showAffiliate = false, heading = "Your top videos",
}: {
  videos: VideoStat[];
  platform: string;
  window: TopWindow;
  sort: SortKey;
  keep: Record<string, string>; // other query params to preserve (e.g. the KPI period)
  basePath?: string;
  showAffiliate?: boolean; // admin leaderboard: show whose video it is
  heading?: string;
}) {
  const href = (extra: Record<string, string>) =>
    `${basePath}?${new URLSearchParams({ ...keep, platform, top: window, sort, ...extra })}`;
  const hookOf = (v: VideoStat) => whyItWorked(v).hook;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="top-videos-heading">
      <h2 id="top-videos-heading" className="text-lg font-semibold">{heading}</h2>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Pills label="Platform" items={PLATFORMS} active={platform} href={(v) => href({ platform: v })} />
        <Pills label="When posted" items={WINDOWS} active={window} href={(v) => href({ top: v })} />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sort by</span>
          <Pills label="Sort by" items={SORTS} active={sort} href={(v) => href({ sort: v })} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Videos posted in the chosen window. &ldquo;All time&rdquo; covers the last 90 days. Weeks start on Monday.
      </p>

      {videos.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No videos here yet. Try a wider window, or press &ldquo;Sync now&rdquo; if you just connected.
        </p>
      ) : (
        <>
          {/* Phones: one card per video */}
          <ol className="flex flex-col gap-3 md:hidden">
            {videos.map((v, i) => (
              <li key={v.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex gap-3">
                  <Thumb url={v.thumbnail_url} size={72} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                      <PlatformBadge platform={v.platform} />
                      {showAffiliate && <span className="text-xs font-medium">{v.profile_name}</span>}
                    </div>
                    <p className="line-clamp-2 text-sm">{hookOf(v)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(v.published_at)}</p>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted p-2 text-center">
                  <div><dt className="text-[11px] uppercase text-muted-foreground">Views</dt><dd className="font-semibold tabular-nums">{formatNumber(v.views)}</dd></div>
                  <div><dt className="text-[11px] uppercase text-muted-foreground">Reach</dt><dd className="font-semibold tabular-nums">{formatNumber(v.reach)}</dd></div>
                  <div><dt className="text-[11px] uppercase text-muted-foreground">Clicks</dt><dd className="font-semibold tabular-nums">{clicks(v)}</dd></div>
                </dl>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <Why v={v} />
                  <Link_ v={v} />
                </div>
              </li>
            ))}
          </ol>

          {/* Larger screens: table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="w-10 p-3"><span className="sr-only">Rank</span></th>
                  <th className="p-3">Video</th>
                  <th className="p-3">Posted</th>
                  <th className="p-3 text-right">Views</th>
                  <th className="p-3 text-right">Reach</th>
                  <th className="p-3 text-right">Link clicks</th>
                  <th className="p-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v, i) => (
                  <tr key={v.id} className="border-t border-border align-top hover:bg-muted/40">
                    <td className="p-3 text-xs font-semibold text-muted-foreground">{i + 1}</td>
                    <td className="p-3">
                      <div className="flex gap-3">
                        <Thumb url={v.thumbnail_url} size={64} />
                        <div className="flex min-w-0 max-w-sm flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <PlatformBadge platform={v.platform} />
                            {showAffiliate && <span className="text-xs font-medium">{v.profile_name}</span>}
                          </div>
                          <span className="line-clamp-2">{hookOf(v)}</span>
                          <Why v={v} />
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-3">{formatDate(v.published_at)}</td>
                    <td className="p-3 text-right font-medium tabular-nums">{formatNumber(v.views)}</td>
                    <td className="p-3 text-right tabular-nums">{formatNumber(v.reach)}</td>
                    <td className="p-3 text-right tabular-nums">{clicks(v)}</td>
                    <td className="p-3"><Link_ v={v} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
