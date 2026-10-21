import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import type { Kpis } from "@/lib/stats";
import { cn } from "@/lib/utils";

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">No earlier data to compare</span>;
  const up = value >= 0;
  return (
    <span className={cn(up ? "text-emerald-600" : "text-destructive")}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}% <span className="text-muted-foreground">vs previous period</span>
    </span>
  );
}

export function KpiCards({
  current, change, igProfileTaps,
}: { current: Kpis; change: Record<keyof Kpis, number | null>; igProfileTaps: number | null }) {
  const cards = [
    { key: "views", label: "Total views", note: "On videos posted in this period" },
    { key: "reach", label: "Total reach", note: "Added up across videos" },
    { key: "link_clicks", label: "Link clicks", note: "Facebook videos only" },
  ] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.key}>
          <CardContent className="flex flex-col gap-1 p-5">
            <span className="text-sm text-muted-foreground">{c.label}</span>
            <span className="text-3xl font-semibold tabular-nums">{formatNumber(current[c.key])}</span>
            <span className="text-xs"><Change value={change[c.key]} /></span>
            <span className="text-xs text-muted-foreground">{c.note}</span>
            {c.key === "link_clicks" && igProfileTaps !== null && (
              <span className="mt-1 text-xs text-muted-foreground">
                Instagram doesn&apos;t report link clicks per video. Taps on your Instagram profile link
                (whole account): <strong className="text-foreground">{formatNumber(igProfileTaps)}</strong>
              </span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
