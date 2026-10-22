import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Four-step "getting started" list for new creators. The first unfinished step is highlighted. */
export function OnboardingChecklist({ connected, synced }: { connected: boolean; synced: boolean }) {
  const steps = [
    { title: "Create your account", text: "Done. You're in.", done: true },
    { title: "Connect your Facebook Page and Instagram", text: "Choose the Page you post videos on. Your linked Instagram comes with it.", done: connected },
    { title: "Sync your videos", text: "We load the last 90 days of videos and their numbers. The first sync can take a minute.", done: synced },
    { title: "See what works", text: "Your top videos, best posting times, and what the winners have in common.", done: false },
  ];
  const current = steps.findIndex((s) => !s.done);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting started</CardTitle>
        <CardDescription>Connect once, and your numbers update by themselves every day.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-4">
          {steps.map((s, i) => (
            <li key={s.title} aria-current={i === current ? "step" : undefined} className="flex gap-3">
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  s.done ? "border-emerald-600 bg-emerald-600 text-white" : i === current ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
                )}
              >
                {s.done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                <span className="sr-only">{s.done ? " (done)" : i === current ? " (next)" : ""}</span>
              </span>
              <div className={cn(!s.done && i !== current && "text-muted-foreground")}>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
