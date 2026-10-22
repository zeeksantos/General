"use client";

import { Check, Eye, EyeOff, Circle } from "lucide-react";
import { useId, useState } from "react";
import { passwordChecks, passwordStrength } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const BAR = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];

/** Password input with a show/hide toggle and, optionally, a live strength meter and rule checklist. */
export function PasswordField({
  label, value, onChange, autoComplete, error, showMeter = false, name,
}: {
  label: string; value: string; onChange: (v: string) => void; autoComplete: string; error?: string; showMeter?: boolean; name?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const strength = passwordStrength(value);
  const describedBy = [error && `${id}-err`, showMeter && `${id}-rules`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id} className="font-medium">{label}</label>
      <div className="relative">
        <Input
          id={id} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} value={value}
          onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={describedBy}
          className={cn("pr-10", error && "border-destructive")}
        />
        <button
          type="button" onClick={() => setVisible((v) => !v)} aria-pressed={visible} aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
      {error && <p id={`${id}-err`} className="text-xs text-destructive">{error}</p>}
      {showMeter && (
        <div id={`${id}-rules`} className="flex flex-col gap-1.5">
          {value && (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 gap-1" aria-hidden>
                {[1, 2, 3, 4].map((i) => <span key={i} className={cn("h-1.5 flex-1 rounded-full bg-muted", i <= strength.score && BAR[strength.score])} />)}
              </div>
              <span className="w-16 text-right text-xs text-muted-foreground">{strength.label}</span>
            </div>
          )}
          <ul className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
            {passwordChecks(value).map((c) => (
              <li key={c.label} className={cn("flex items-center gap-1", c.ok ? "text-emerald-600" : "text-muted-foreground")}>
                {c.ok ? <Check className="h-3 w-3" aria-hidden /> : <Circle className="h-3 w-3" aria-hidden />}
                {c.label}<span className="sr-only">{c.ok ? " (done)" : " (not yet)"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
