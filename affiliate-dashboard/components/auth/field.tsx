"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Labelled input with an optional hint and an inline error that screen readers read with the field. */
export function Field({ label, hint, error, className, ...props }: { label: string; hint?: string; error?: string } & React.ComponentProps<"input">) {
  const id = useId();
  const describedBy = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id} className="font-medium">{label}</label>
      <Input id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={cn(error && "border-destructive", className)} {...props} />
      {error && <p id={`${id}-err`} className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
