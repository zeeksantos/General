"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/lib/stats";

const FB = "#2563eb";
const IG = "#db2777";

function Chart({ data, metric, title }: { data: TrendPoint[]; metric: "views" | "reach"; title: string }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <div className="h-56" role="img" aria-label={`${title} by publish date, Facebook versus Instagram`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} fontSize={12} minTickGap={24} />
            <YAxis fontSize={12} width={44} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={`facebook_${metric}`} name="Facebook" stroke={FB} dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey={`instagram_${metric}`} name="Instagram" stroke={IG} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Chart data={data} metric="views" title="Views by day posted" />
      <Chart data={data} metric="reach" title="Reach by day posted" />
    </div>
  );
}
