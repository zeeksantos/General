import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DEMO_MODE } from "@/lib/config";
import { getViewer } from "@/lib/viewer";
import { Button } from "@/components/ui/button";

async function Shell({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {DEMO_MODE && (
        <div role="status" className="bg-amber-100 px-6 py-1.5 text-center text-sm text-amber-900">
          Demo mode — you are looking at sample data, not real accounts.
        </div>
      )}
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-4 py-3 sm:px-6">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-semibold whitespace-nowrap">Affiliate Dashboard</span>
          <Link href="/dashboard" className="whitespace-nowrap hover:underline">My videos</Link>
          <Link href="/settings" className="whitespace-nowrap hover:underline">Settings</Link>
          {viewer.role === "admin" && <Link href="/admin" className="hover:underline">Admin</Link>}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            {viewer.name || viewer.email}
            {viewer.role === "admin" && " · Admin"}
          </span>
          {!DEMO_MODE && (
            <form action="/auth/signout" method="post">
              <Button variant="outline" size="sm" type="submit">Sign out</Button>
            </form>
          )}
        </div>
      </header>
      <div className="flex-1 p-4 sm:p-6">{children}</div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
