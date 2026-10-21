import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RangeKind } from "@/lib/dates";

const OPTIONS: { kind: RangeKind; label: string }[] = [
  { kind: "7d", label: "Last 7 days" },
  { kind: "30d", label: "Last 30 days" },
  { kind: "month", label: "This month" },
  { kind: "custom", label: "Custom" },
];

/** Server-rendered: plain links + a GET form, no client JS. `keep` carries the other filters through. */
export function PeriodSelector({
  active, from, to, keep,
}: { active: RangeKind; from: string; to: string; keep: Record<string, string> }) {
  const href = (extra: Record<string, string>) => `/dashboard?${new URLSearchParams({ ...keep, ...extra })}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-md border border-border p-0.5 text-sm">
        {OPTIONS.filter((o) => o.kind !== "custom").map((o) => (
          <Link
            key={o.kind}
            href={href({ range: o.kind })}
            className={cn("rounded px-3 py-1", active === o.kind ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            {o.label}
          </Link>
        ))}
      </div>
      <form action="/dashboard" className="flex flex-wrap items-center gap-2 text-sm">
        {Object.entries(keep).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <input type="hidden" name="range" value="custom" />
        <label className="sr-only" htmlFor="from">From</label>
        <input id="from" name="from" type="date" defaultValue={from} required className="h-8 rounded-md border border-border bg-background px-2" />
        <span className="text-muted-foreground">to</span>
        <label className="sr-only" htmlFor="to">To</label>
        <input id="to" name="to" type="date" defaultValue={to} required className="h-8 rounded-md border border-border bg-background px-2" />
        <button type="submit" className={cn("h-8 rounded-md border border-border px-3 hover:bg-muted", active === "custom" && "bg-primary text-primary-foreground hover:bg-primary")}>
          Apply
        </button>
      </form>
    </div>
  );
}
