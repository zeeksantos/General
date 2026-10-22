"use client";

import { useState } from "react";
import { FormMessage } from "@/components/auth/auth-card";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { validatePassword } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validatePassword(password) ?? (password === confirm ? null : "The two passwords don't match.");
    if (problem) return setError(problem);
    setStatus("busy");
    setError("");
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setStatus("idle");
      return setError(error.code === "same_password" ? "Choose a password you haven't used before." : error.code === "weak_password" ? "That password is too easy to guess." : "We couldn't update your password. Please sign in again and retry.");
    }
    setPassword("");
    setConfirm("");
    setStatus("done");
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-3" noValidate>
      <PasswordField label="New password" autoComplete="new-password" showMeter value={password} onChange={setPassword} />
      <PasswordField label="Confirm new password" autoComplete="new-password" value={confirm} onChange={setConfirm} />
      <Button type="submit" className="self-start" disabled={status === "busy"}>{status === "busy" ? "Saving…" : "Save password"}</Button>
      {error && <FormMessage kind="error">{error}</FormMessage>}
      {status === "done" && <FormMessage kind="info">Password updated.</FormMessage>}
    </form>
  );
}
