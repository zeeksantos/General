import { APP_LOCALE, APP_TIMEZONE } from "./config.ts";

const nf = new Intl.NumberFormat(APP_LOCALE);
const compact = new Intl.NumberFormat(APP_LOCALE, { notation: "compact", maximumFractionDigits: 1 });

export const formatNumber = (n: number) => nf.format(n);
export const formatCompact = (n: number) => compact.format(n);
export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(APP_LOCALE, { timeZone: APP_TIMEZONE, dateStyle: "medium" }).format(new Date(iso));

/** "just now", "5 min ago", "3 h ago", "2 days ago" (English, short; for sync times). */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const secs = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}
