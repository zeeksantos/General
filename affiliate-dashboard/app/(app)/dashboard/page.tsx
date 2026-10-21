import { createClient } from "@/lib/supabase/server";
import { ConnectionsCard, type ConnectionRow } from "@/components/connections-card";

const ERRORS: Record<string, string> = {
  denied: "Facebook login was cancelled or not approved. Please try again.",
  state: "That login attempt expired or didn't start here. Please try again.",
  exchange: "We couldn't finish connecting to Facebook. Please try again.",
  expired: "Your connection session expired. Please start again.",
  page: "We couldn't find that Page. Please try again.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ connect_error?: string; connected?: string }>;
}) {
  const { connect_error, connected } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("connections")
    .select("id, platform, account_name, status, last_synced_at")
    .order("created_at");
  const connections = (data ?? []) as ConnectionRow[];
  const needsReconnect = connections.some((c) => c.status === "needs_reconnect");

  return (
    <div className="flex flex-col gap-4">
      {needsReconnect && (
        <p role="alert" className="max-w-xl rounded-md border border-destructive p-3 text-sm text-destructive">
          One of your accounts lost its connection to Facebook. Please reconnect so your stats keep updating.
        </p>
      )}
      {connect_error && (
        <p role="alert" className="max-w-xl rounded-md border border-destructive p-3 text-sm text-destructive">
          {ERRORS[connect_error] ?? ERRORS.exchange}
        </p>
      )}
      {connected === "no_instagram" && (
        <p role="status" className="max-w-xl rounded-md border border-border p-3 text-sm">
          Your Facebook Page is connected, but it has no Instagram professional account linked. Instagram
          stats only work for Business or Creator accounts connected to your Page — switch your Instagram
          account type, link it to the Page, then reconnect.
        </p>
      )}
      {connected === "connected" && (
        <p role="status" className="max-w-xl rounded-md border border-border p-3 text-sm">
          Connected! Your videos will show up after the first sync.
        </p>
      )}
      <ConnectionsCard connections={connections} />
    </div>
  );
}
