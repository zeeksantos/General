import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { disconnect } from "@/app/(app)/connect/pick/actions";

export type ConnectionRow = {
  id: string;
  platform: "facebook" | "instagram";
  account_name: string;
  status: "active" | "needs_reconnect" | "disconnected";
  last_synced_at: string | null;
};

const PLATFORM_LABEL = { facebook: "Facebook Page", instagram: "Instagram" } as const;

export function ConnectionsCard({ connections }: { connections: ConnectionRow[] }) {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Your accounts</CardTitle>
        <CardDescription>
          Connect your Facebook Page and Instagram professional account to see your top videos.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {connections.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
            <div>
              <div className="font-medium">{c.account_name}</div>
              <div className="text-muted-foreground">
                {PLATFORM_LABEL[c.platform]} ·{" "}
                {c.status === "needs_reconnect" ? (
                  <span className="text-destructive">Needs reconnecting</span>
                ) : (
                  "Connected"
                )}
              </div>
            </div>
            <form action={disconnect}>
              <input type="hidden" name="connection_id" value={c.id} />
              <Button type="submit" variant="outline" size="sm">Disconnect</Button>
            </form>
          </div>
        ))}
        <Button asChild className="self-start">
          {/* Plain anchor: this starts an external OAuth redirect, not a client navigation. */}
          <a href="/api/meta/connect">
            {connections.length ? "Reconnect or add another Page" : "Connect Facebook & Instagram"}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
