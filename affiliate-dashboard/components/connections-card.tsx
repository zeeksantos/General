import { APP_TIMEZONE } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { disconnect } from "@/app/(app)/connect/pick/actions";
import { syncNow } from "@/app/(app)/dashboard/actions";

export type ConnectionRow = {
  id: string;
  platform: "facebook" | "instagram";
  account_name: string;
  status: "active" | "needs_reconnect" | "disconnected";
  last_synced_at: string | null;
};

const PLATFORM_LABEL = { facebook: "Facebook Page", instagram: "Instagram" } as const;

// Until Meta approves the app (App Review), only people added as testers can connect an account.
const META_APP_LIVE = process.env.NEXT_PUBLIC_META_APP_LIVE === "true";

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
                {c.last_synced_at
                  ? ` · Last synced ${new Date(c.last_synced_at).toLocaleString("en-PH", { timeZone: APP_TIMEZONE, dateStyle: "medium", timeStyle: "short" })}`
                  : " · Not synced yet"}
              </div>
            </div>
            <form action={disconnect}>
              <input type="hidden" name="connection_id" value={c.id} />
              <Button type="submit" variant="outline" size="sm">Disconnect</Button>
            </form>
          </div>
        ))}
        {connections.length > 0 && (
          <form action={syncNow} className="self-start">
            <Button type="submit" variant="outline">Sync now</Button>
          </form>
        )}
        {!META_APP_LIVE && (
          <p className="rounded-md border border-border p-3 text-xs text-muted-foreground">
            Heads up: Facebook is still reviewing our app. Until it is approved, only invited testers can connect a Facebook
            Page. You can create your account now and connect once the review is done.
          </p>
        )}
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
