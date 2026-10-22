// Small, pure helpers for the admin tables (search + sort). No React, easy to test.

export type SortDir = "asc" | "desc";
export type SortState<K extends string> = { key: K; dir: SortDir };

/** Every word of the query must appear (case-insensitive) in at least one of the fields. */
export function matchesQuery(query: string, ...fields: (string | null | undefined)[]): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return words.every((w) => haystack.includes(w));
}

/** Stable sort. Strings use locale order, numbers numeric order; null/undefined always go last. */
export function sortBy<T>(rows: readonly T[], get: (row: T) => string | number | null | undefined, dir: SortDir): T[] {
  const sign = dir === "asc" ? 1 : -1;
  return rows
    .map((row, i) => ({ row, i, v: get(row) }))
    .sort((a, b) => {
      const an = a.v === null || a.v === undefined;
      const bn = b.v === null || b.v === undefined;
      if (an || bn) return an === bn ? a.i - b.i : an ? 1 : -1; // nulls last in both directions
      const c = typeof a.v === "number" && typeof b.v === "number" ? a.v - b.v : String(a.v).localeCompare(String(b.v), "en", { sensitivity: "base" });
      return c !== 0 ? sign * c : a.i - b.i;
    })
    .map((x) => x.row);
}

/** Clicking the active column flips the direction; clicking another column starts with `firstDir`. */
export function nextSort<K extends string>(current: SortState<K>, key: K, firstDir: SortDir = "asc"): SortState<K> {
  return current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: firstDir };
}
