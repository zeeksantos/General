import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteMyData } from "@/app/(app)/dashboard/actions";

export function DeleteDataCard() {
  return (
    <details className="max-w-xl rounded-xl border border-border p-4 text-sm">
      <summary className="cursor-pointer font-medium">Delete my data</summary>
      <form action={deleteMyData} className="mt-3 flex flex-col gap-3">
        <p className="text-muted-foreground">
          This permanently deletes your connected accounts, access tokens, video statistics and your login. It does
          not touch your Facebook or Instagram accounts or posts, and it cannot be undone.
        </p>
        <label className="flex flex-col gap-1">
          <span>Type <code>DELETE</code> to confirm</span>
          <Input name="confirm" autoComplete="off" required />
        </label>
        <Button type="submit" variant="destructive" className="self-start">Delete everything</Button>
      </form>
    </details>
  );
}
