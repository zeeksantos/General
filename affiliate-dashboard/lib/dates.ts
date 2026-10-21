// Date helpers on Asia/Manila calendar days (UTC+8, no DST). Dates are "YYYY-MM-DD" strings.
const OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type Range = { from: string; to: string }; // inclusive

export const manilaDate = (d: Date): string => new Date(d.getTime() + OFFSET_MS).toISOString().slice(0, 10);

/** The instant a Manila calendar day starts. */
export const dayStart = (date: string): Date => new Date(Date.parse(`${date}T00:00:00Z`) - OFFSET_MS);

export const addDays = (date: string, n: number): string =>
  new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);

export const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

/** Monday of the week containing `date`. */
export function weekStart(date: string): string {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(date, -((dow + 6) % 7));
}

export const monthStart = (date: string): string => `${date.slice(0, 8)}01`;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const isValidDay = (s: string | undefined): s is string =>
  !!s && ISO_DAY.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && manilaDate(dayStart(s)) === s;

export type RangeKind = "7d" | "30d" | "month" | "custom";
export const MAX_CUSTOM_DAYS = 366;

export function resolveRange(kind: string | undefined, today: string, from?: string, to?: string): { kind: RangeKind; range: Range } {
  switch (kind) {
    case "7d": return { kind: "7d", range: { from: addDays(today, -6), to: today } };
    case "month": return { kind: "month", range: { from: monthStart(today), to: today } };
    case "custom":
      if (isValidDay(from) && isValidDay(to) && from <= to && daysBetween(from, to) < MAX_CUSTOM_DAYS) {
        return { kind: "custom", range: { from, to } };
      }
    // fall through to the default for invalid custom input
    default: return { kind: "30d", range: { from: addDays(today, -29), to: today } };
  }
}

/** The period of equal length immediately before `r`. */
export function previousRange(r: Range): Range {
  const len = daysBetween(r.from, r.to) + 1;
  return { from: addDays(r.from, -len), to: addDays(r.from, -1) };
}

/** Is an ISO timestamp inside the inclusive Manila-day range? */
export function inRange(iso: string, r: Range): boolean {
  const t = new Date(iso).getTime();
  return t >= dayStart(r.from).getTime() && t < dayStart(addDays(r.to, 1)).getTime();
}

export function eachDay(r: Range): string[] {
  return Array.from({ length: daysBetween(r.from, r.to) + 1 }, (_, i) => addDays(r.from, i));
}
