"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard, FormMessage } from "@/components/auth/auth-card";
import { Field } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("busy");
    setError("");
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings/password`,
    });
    if (error && error.status === 429) {
      setStatus("idle");
      return setError("Too many requests. Please wait a few minutes and try again.");
    }
    setStatus("sent"); // same answer whether or not the address has an account
  }

  if (status === "sent") {
    return (
      <AuthCard title="Check your email">
        <FormMessage kind="info">If an account exists for {email}, we sent a link to reset the password. Open it in this browser.</FormMessage>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Reset your password" description="Enter your email and we'll send you a reset link.">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Field label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" disabled={status === "busy"}>{status === "busy" ? "Sending…" : "Send reset link"}</Button>
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <Link className="text-sm underline" href="/login">Back to sign in</Link>
      </form>
    </AuthCard>
  );
}
