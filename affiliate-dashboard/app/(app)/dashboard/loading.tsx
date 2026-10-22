// Shown while the dashboard's data loads. Mirrors the final layout so nothing jumps.
const pulse = "animate-pulse rounded-lg bg-muted";

export default function Loading() {
  return (
    <div className="flex max-w-6xl flex-col gap-5" aria-busy="true" aria-label="Loading your dashboard">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-2"><div className={`${pulse} h-7 w-40`} /><div className={`${pulse} h-4 w-64`} /></div>
        <div className={`${pulse} h-9 w-72`} />
      </div>
      <div className={`${pulse} h-12`} />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className={`${pulse} h-32`} />)}
      </div>
      <div className={`${pulse} h-72`} />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => <div key={i} className={`${pulse} h-20`} />)}
      </div>
    </div>
  );
}
