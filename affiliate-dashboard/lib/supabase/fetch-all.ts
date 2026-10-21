const PAGE = 1000; // PostgREST's default max rows per request

/** Reads every row of a query by paging. `build` must return a fresh, ordered query for the given range. */
export async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error("query failed");
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}
