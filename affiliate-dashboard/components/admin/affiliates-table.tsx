"use client";

import { useMemo, useState } from "react";
import { resyncAffiliate } from "@/app/(app)/admin/actions";
import { Button } from "@/components/ui/button";
import type { AffiliateSummary, SyncStatus } from "@/lib/admin";
import { formatDate, formatNumber } from "@/lib/format";
import { matchesQuery, nextSort, sortBy, type SortState } from "@/lib/table";
import { cn } from "@/lib/utils";
import { SortHeader } from "./sort-header";
import { TableToolbar } from "./table-toolbar";

const STATUS: Record<SyncStatus, { label: string; className: string; rank: number }> = {
  needs_reconnect: { label: "Needs reconnect", className: "text-destructive", rank: 0 },
  never_synced: { label: "Not synced yet", className: "text-amber-600", rank: 1 },
  no_accounts: { label: "No accounts connected", className: "text-muted-foreground", rank: 2 },
  ok: { label: "Up to date", className: "text-emerald-600", rank: 3 },
};
type Key = "name" | "status" | "views" | "reach";
type Filter = "all" | "attention";
const needsAttention = (s: SyncStatus) => s === "needs_reconnect" || s === "never_synced";

export function AffiliatesTable({ rows }: { rows: AffiliateSummary[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortState<Key>>({ key: "views", dir: "desc" });

  const shown = useMemo(() => {
    const filtered = rows.filter(
      (r) => (filter === "all" || needsAttention(r.status)) && matchesQuery(query, r.profile.name, r.profile.email, ...r.accounts.map((a) => a.name)),
    );
    const get = (r: AffiliateSummary) =>
      sort.key === "name" ? r.profile.name || r.profile.email : sort.key === "status" ? STATUS[r.status].rank : r[sort.key];
    return sortBy(filtered, get, sort.dir);
  }, [rows, query, filter, sort]);

  const header = (key: Key, label: string, align: "left" | "right" = "left", first: "asc" | "desc" = "asc") => (
    <SortHeader label={label} align={align} active={sort.key === key} dir={sort.dir} onClick={() => setSort(nextSort(sort, key, first))} />
  );

  return (
    <div className="flex flex-col gap-3">
      <TableToolbar
        query={query} onQuery={setQuery} placeholder="Search name, email or account"
        filters={[{ value: "all", label: "Everyone", count: rows.length }, { value: "attention", label: "Needs attention", count: rows.filter((r) => needsAttention(r.status)).length }]}
        filter={filter} onFilter={setFilter} shown={shown.length} total={rows.length}
      />
      {shown.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {rows.length === 0 ? "No affiliates have been approved yet." : "No affiliates match. Try a different search or filter."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                {header("name", "Affiliate")}
                <th scope="col" className="p-3 text-xs font-medium uppercase text-muted-foreground">Connected accounts</th>
                {header("status", "Sync status")}
                {header("views", "Views (30d)", "right", "desc")}
                {header("reach", "Reach (30d)", "right", "desc")}
                <th scope="col" className="p-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.profile.id} className="border-t border-border align-top hover:bg-muted/40">
                  <td className="p-3">
                    <div className="font-medium">{s.profile.name || s.profile.email || "Unknown"}</div>
                    {s.profile.name && <div className="text-xs text-muted-foreground">{s.profile.email}</div>}
                  </td>
                  <td className="p-3">
                    {s.accounts.length === 0 ? "—" : (
                      <ul className="flex flex-col gap-0.5">
                        {s.accounts.map((a, i) => (
                          <li key={i}>
                            {a.name} <span className="text-xs text-muted-foreground">({a.platform === "facebook" ? "Facebook" : "Instagram"})</span>
                            {a.status === "needs_reconnect" && <span className="ml-1 text-xs text-destructive">needs reconnect</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="p-3">
                    <div className={cn("font-medium", STATUS[s.status].className)}>{STATUS[s.status].label}</div>
                    {s.lastSyncedAt && <div className="text-xs text-muted-foreground">Last synced {formatDate(s.lastSyncedAt)}</div>}
                  </td>
                  <td className="p-3 text-right tabular-nums">{formatNumber(s.views)}</td>
                  <td className="p-3 text-right tabular-nums">{formatNumber(s.reach)}</td>
                  <td className="p-3 text-right">
                    {s.accounts.length > 0 && (
                      <form action={resyncAffiliate}>
                        <input type="hidden" name="profile_id" value={s.profile.id} />
                        <Button type="submit" variant="outline" size="sm">Re-sync</Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
