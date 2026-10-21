import { DeleteDataCard } from "@/components/delete-data-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const COPY = {
  pending: {
    title: "Your account is waiting for approval",
    body: "Thanks for signing up. Our team reviews new accounts before they can connect Facebook and Instagram. We'll email you as soon as you're approved. You can close this page.",
  },
  suspended: {
    title: "Your account is paused",
    body: "Your account has been suspended, so you can't see or connect your data right now. If you think this is a mistake, please contact Z-Fast Digital Marketing Agency.",
  },
} as const;

/** Shown instead of the app for accounts that are not active. */
export function AccountStatus({ status, showSignOut }: { status: "pending" | "suspended"; showSignOut: boolean }) {
  const copy = COPY[status];
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.body}</CardDescription>
        </CardHeader>
        {showSignOut && (
          <CardContent>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline">Sign out</Button>
            </form>
          </CardContent>
        )}
      </Card>
      <DeleteDataCard />
    </div>
  );
}
