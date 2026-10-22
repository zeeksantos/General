import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteDataCard } from "@/components/delete-data-card";
import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEMO_MODE } from "@/lib/config";
import { getViewer } from "@/lib/viewer";
import { updateProfile } from "./actions";

export const metadata = { title: "Account settings" };

const MESSAGES: Record<string, string> = {
  ok: "Saved.",
  invalid: "Please enter a name of 80 characters or fewer.",
  failed: "We couldn't save that. Please try again.",
  demo: "Demo mode: changes aren't saved.",
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; delete_error?: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { saved, delete_error } = await searchParams;

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="text-xl font-semibold">Account settings</h1>
      {saved && <Notice kind={saved === "ok" ? "success" : saved === "demo" ? "info" : "error"}>{MESSAGES[saved] ?? MESSAGES.failed}</Notice>}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>{viewer.email ?? (DEMO_MODE ? "Demo account" : "")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Your name</span>
              <Input name="name" defaultValue={viewer.name} maxLength={80} required />
            </label>
            <Button type="submit" className="self-start">Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Add or change the password you use to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline"><Link href="/settings/password">Set or change password</Link></Button>
        </CardContent>
      </Card>

      {delete_error && (
        <Notice kind="error">{delete_error === "confirm" ? "Type DELETE exactly to confirm." : "We couldn't delete your data. Please try again or contact us."}</Notice>
      )}
      <DeleteDataCard />
    </div>
  );
}
