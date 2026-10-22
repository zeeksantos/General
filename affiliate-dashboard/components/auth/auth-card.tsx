import { BarChart3, Lightbulb, ShieldCheck } from "lucide-react";

const POINTS = [
  { icon: BarChart3, title: "See your best videos", text: "Facebook and Instagram in one place, by week or month." },
  { icon: Lightbulb, title: "Learn what works", text: "Hook, length, format and posting time for every video." },
  { icon: ShieldCheck, title: "Your data stays yours", text: "Read-only access. Disconnect or delete everything any time." },
];

/** Shared frame for sign-in, sign-up and reset pages: short pitch on the left (desktop), the form on the right. */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden flex-col justify-between gap-8 bg-muted p-8 md:flex">
          <div>
            <p className="text-sm font-semibold">Z-Fast Affiliate Dashboard</p>
            <p className="mt-2 text-xl font-semibold leading-snug tracking-tight">Know which of your videos are worth repeating.</p>
          </div>
          <ul className="flex flex-col gap-4">
            {POINTS.map(({ icon: Icon, title: t, text }) => (
              <li key={t} className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <div><p className="text-sm font-medium">{t}</p><p className="text-sm text-muted-foreground">{text}</p></div>
              </li>
            ))}
          </ul>
        </aside>
        <div className="flex flex-col gap-4 p-6 sm:p-8">
          <p className="text-sm font-semibold md:hidden">Z-Fast Affiliate Dashboard</p>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

export function FormMessage({ kind, children }: { kind: "error" | "info"; children: React.ReactNode }) {
  return (
    <p role={kind === "error" ? "alert" : "status"} className={kind === "error" ? "text-sm text-destructive" : "text-sm"}>
      {children}
    </p>
  );
}
