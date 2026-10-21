import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

async function Shell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <span className="font-semibold">Affiliate Dashboard</span>
          <Link href="/dashboard" className="hover:underline">My videos</Link>
          {profile?.role === "admin" && <Link href="/admin" className="hover:underline">Admin</Link>}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            {profile?.name || user.email}
            {profile?.role === "admin" && " · Admin"}
          </span>
          <form action="/auth/signout" method="post">
            <Button variant="outline" size="sm" type="submit">Sign out</Button>
          </form>
        </div>
      </header>
      <div className="flex-1 p-6">{children}</div>
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
