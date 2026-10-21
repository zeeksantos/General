"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/sync-log", label: "Sync log" },
];

export function AdminNav({ pending }: { pending: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin sections" className="mb-6 flex gap-1 border-b border-border text-sm">
      {TABS.map((t) => {
        const active = t.href === "/admin" ? path === "/admin" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn("-mb-px border-b-2 px-3 py-2", active ? "border-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            {t.label}
            {t.href === "/admin/users" && pending > 0 && (
              <span className="ml-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-white">{pending}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
