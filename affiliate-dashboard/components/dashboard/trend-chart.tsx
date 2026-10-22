"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompact, formatNumber } from "@/lib/format";
import type { TrendBucket, TrendPoint } from "@/lib/stats";

const FB = "#2563eb";
const IG = "#db2777";

const label = (date: string, bucket: TrendBucket) => {
  const [, m, d] = date.split("-");
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m) - 1];
  return bucket === "week" ? `Week of ${month} ${Number(d)}` : `${month} ${Number(d)}`;
};

function Chart({ data, metric, title, bucket }: { data: TrendPoint[]; metric: "views" | "reach"; title: string; bucket: TrendBucket }) {
  const total = data.reduce((n, p) => n + p[`facebook_${metric}`] + p[`instagram_${metric}`], 0);
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      {total === 0 ? (
        <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
          No videos were posted in this period. Pick a longer period to see more.
        </div>
      ) : (
        <div className="h-56" role="img" aria-label={`${title}: ${formatNumber(total)} in total, Facebook and Instagram stacked`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(d: string) => label(d, bucket).replace("Week of ", "")} fontSize={12} minTickGap={24} tickLine={false} />
              <YAxis fontSize={12} width={52} allowDecimals={false} tickLine={false} axisLine={false} tickFormatter={(n: number) => formatCompact(n)} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                labelFormatter={(d) => label(String(d), bucket)}
                formatter={(v, name) => [formatNumber(Number(v)), name]}
                contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--card-foreground)" }}
              />
              <Legend iconType="circle" />
              <Bar dataKey={`facebook_${metric}`} name="Facebook" stackId="a" fill={FB} radius={[0, 0, 0, 0]} />
              <Bar dataKey={`instagram_${metric}`} name="Instagram" stackId="a" fill={IG} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function TrendChart({ data, bucket }: { data: TrendPoint[]; bucket: TrendBucket }) {
  const by = bucket === "week" ? "week" : "day";
  return (
    <div className="grid gap-6 rounded-xl border border-border bg-card p-5 lg:grid-cols-2">
      <Chart data={data} metric="views" title={`Views by ${by} posted`} bucket={bucket} />
      <Chart data={data} metric="reach" title={`Reach by ${by} posted`} bucket={bucket} />
    </div>
  );
}
