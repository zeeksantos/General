import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listPages } from "@/lib/meta/oauth";
import { readToken } from "@/lib/meta/tokens";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { selectPage } from "./actions";

export default async function PickPagePage() {
  const pendingId = (await cookies()).get("meta_pending_token")?.value;
  if (!pendingId) redirect("/dashboard?connect_error=expired");

  let pages;
  try {
    pages = await listPages(await readToken(pendingId));
  } catch {
    redirect("/dashboard?connect_error=exchange");
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Choose your Facebook Page</CardTitle>
        <CardDescription>
          We&apos;ll connect this Page and the Instagram account linked to it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {pages.length === 0 && (
          <p className="text-sm">
            We couldn&apos;t find any Facebook Pages you manage. Make sure you selected a Page in the
            Facebook popup, then <Link className="underline" href="/api/meta/connect">try again</Link>.
          </p>
        )}
        {pages.map((page) => (
          <form key={page.id} action={selectPage} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <input type="hidden" name="page_id" value={page.id} />
            <div className="text-sm">
              <div className="font-medium">{page.name}</div>
              <div className="text-muted-foreground">
                {page.instagram_business_account
                  ? `Instagram: @${page.instagram_business_account.username ?? page.instagram_business_account.id}`
                  : "No Instagram professional account linked"}
              </div>
            </div>
            <Button type="submit" size="sm">Connect</Button>
          </form>
        ))}
      </CardContent>
    </Card>
  );
}
