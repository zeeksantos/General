"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { SortDir } from "@/lib/table";
import { cn } from "@/lib/utils";

/** Column header that sorts when clicked; announces its sort state to screen readers. */
export function SortHeader({
  label, active, dir, onClick, align = "left",
}: { label: string; active: boolean; dir: SortDir; onClick: () => void; align?: "left" | "right" }) {
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th scope="col" aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"} className={cn("p-3", align === "right" && "text-right")}>
      <button
        type="button" onClick={onClick}
        className={cn("inline-flex items-center gap-1 text-xs font-medium uppercase hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "text-foreground" : "text-muted-foreground")}
      >
        {label}
        <Icon className="h-3 w-3" aria-hidden />
      </button>
    </th>
  );
}
