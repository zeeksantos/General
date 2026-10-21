"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a magic link. No password needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "sent" ? (
            <p className="text-sm">Check your inbox — the sign-in link is on its way to {email}.</p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
              />
              <Button type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : "Send magic link"}
              </Button>
              {status === "error" && (
                <p role="alert" className="text-sm text-destructive">{message}</p>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
