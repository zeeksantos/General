import { Suspense } from "react";
import { DEMO_MODE } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function Status({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const valid = typeof code === "string" && /^[0-9a-f]{32}$/.test(code);
  const row = valid && !DEMO_MODE
    ? (await createAdminClient().from("deletion_requests").select("status, requested_at, connections_deleted").eq("code", code).maybeSingle()).data
    : null;

  return (
    <Card className="w-full max-w-xl">
      <CardHeader><CardTitle>Data deletion status</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {row ? (
          <>
            <p><strong>Completed.</strong> Your data was deleted on {formatDate(row.requested_at)}.</p>
            <p className="text-muted-foreground">
              We removed {row.connections_deleted} connected {row.connections_deleted === 1 ? "account" : "accounts"},
              their access tokens and all video statistics we had stored for them.
            </p>
            <p className="text-muted-foreground">Confirmation code: <code>{code}</code></p>
          </>
        ) : (
          <p>We couldn&apos;t find a deletion request with that code. Check the link and try again.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DeletionStatusPage(props: { searchParams: Promise<{ code?: string }> }) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <Status {...props} />
      </Suspense>
    </main>
  );
}
