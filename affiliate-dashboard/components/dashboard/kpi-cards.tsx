import { Eye, MousePointerClick, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import type { Kpis } from "@/lib/stats";
import { cn } from "@/lib/utils";

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">Nothing earlier to compare with</span>;
  const up = value >= 0;
  return (
    <span className={cn("font-medium", up ? "text-emerald-600" : "text-destructive")}>
      <span aria-hidden>{up ? "▲" : "▼"}</span> {Math.abs(value).toFixed(1)}%{" "}
      <span className="font-normal text-muted-foreground">{up ? "more" : "less"} than the period before</span>
    </span>
  );
}

const CARDS = [
  { key: "views", label: "Views", icon: Eye, note: "On videos you posted in this period" },
  { key: "reach", label: "Reach", icon: Users, note: "Added up across your videos" },
  { key: "link_clicks", label: "Link clicks", icon: MousePointerClick, note: "Facebook videos only" },
] as const;

export function KpiCards({
  current, change, igProfileTaps,
}: { current: Kpis; change: Record<keyof Kpis, number | null>; igProfileTaps: number | null }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {CARDS.map(({ key, label, icon: Icon, note }) => (
        <Card key={key}>
          <CardContent className="flex flex-col gap-1.5 p-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{label}</span>
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <span className="text-3xl font-semibold tabular-nums tracking-tight">{formatNumber(current[key])}</span>
            <span className="text-xs"><Change value={change[key]} /></span>
            <span className="text-xs text-muted-foreground">{note}</span>
            {key === "link_clicks" && igProfileTaps !== null && (
              <span className="mt-1 border-t border-border pt-2 text-xs text-muted-foreground">
                Instagram doesn&apos;t report clicks per video. Taps on your Instagram profile link (whole account):{" "}
                <strong className="text-foreground">{formatNumber(igProfileTaps)}</strong>
              </span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
