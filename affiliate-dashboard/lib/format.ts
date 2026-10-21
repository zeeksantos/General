import { APP_LOCALE, APP_TIMEZONE } from "./config";

const nf = new Intl.NumberFormat(APP_LOCALE);
const compact = new Intl.NumberFormat(APP_LOCALE, { notation: "compact", maximumFractionDigits: 1 });

export const formatNumber = (n: number) => nf.format(n);
export const formatCompact = (n: number) => compact.format(n);
export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(APP_LOCALE, { timeZone: APP_TIMEZONE, dateStyle: "medium" }).format(new Date(iso));
