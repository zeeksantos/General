"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Search box plus a row of filter chips; shared by the admin tables. */
export function TableToolbar<F extends string>({
  query, onQuery, placeholder, filters, filter, onFilter, shown, total,
}: {
  query: string; onQuery: (q: string) => void; placeholder: string;
  filters: { value: F; label: string; count?: number }[]; filter: F; onFilter: (f: F) => void;
  shown: number; total: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative min-w-[14rem] flex-1 sm:max-w-xs">
        <span className="sr-only">Search</span>
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder={placeholder}
          className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <div role="group" aria-label="Filter" className="inline-flex rounded-md border border-border p-0.5 text-sm">
        {filters.map((f) => (
          <button
            key={f.value} type="button" onClick={() => onFilter(f.value)} aria-pressed={filter === f.value}
            className={cn("rounded px-3 py-1.5", filter === f.value ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            {f.label}{f.count !== undefined && <span className="ml-1 opacity-70">({f.count})</span>}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">Showing {shown} of {total}</p>
    </div>
  );
}
