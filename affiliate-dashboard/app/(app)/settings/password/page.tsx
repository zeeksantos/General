import Link from "next/link";
import { PasswordForm } from "./password-form";

export const metadata = { title: "Change password" };

export default function PasswordPage() {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Set or change your password</h1>
        <p className="text-sm text-muted-foreground">
          Signed up with an email link? You can add a password here. <Link className="underline" href="/settings">Back to settings</Link>
        </p>
      </div>
      <PasswordForm />
    </div>
  );
}
