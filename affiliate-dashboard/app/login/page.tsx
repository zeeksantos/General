import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  link: "That link has expired or was opened in a different browser. Please sign in or request a new link.",
};

async function Form({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <LoginForm notice={error ? NOTICES[error] ?? "Something went wrong. Please try again." : undefined} />;
}

export default function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
  return (
    <Suspense fallback={null}>
      <Form {...props} />
    </Suspense>
  );
}
