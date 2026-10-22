import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES = {
  info: { box: "border-border bg-card", icon: Info, tone: "text-muted-foreground" },
  success: { box: "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40", icon: CheckCircle2, tone: "text-emerald-600" },
  error: { box: "border-destructive/50 bg-red-50 dark:bg-red-950/30", icon: AlertCircle, tone: "text-destructive" },
} as const;

/** Inline message with an icon. Errors are announced immediately (role=alert), the rest politely (role=status). */
export function Notice({ kind = "info", children, className }: { kind?: keyof typeof STYLES; children: React.ReactNode; className?: string }) {
  const { box, icon: Icon, tone } = STYLES[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-lg border p-3 text-sm", box, className)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
