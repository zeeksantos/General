"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard, FormMessage } from "@/components/auth/auth-card";
import { Field } from "@/components/auth/field";
import { PasswordField } from "@/components/auth/password-field";
import { CAPTCHA_MESSAGE, isCaptchaError, useCaptcha } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ notice }: { notice?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState(notice ?? "");
  const captcha = useCaptcha();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("busy");
    setError("");
    const supabase = createClient();
    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken: captcha.token } });
      if (error) {
        setStatus("idle");
        captcha.reset();
        if (isCaptchaError(error.code)) return setError(CAPTCHA_MESSAGE);
        // Same message for unknown email and wrong password, so accounts can't be probed.
        setError(error.code === "email_not_confirmed" ? "Please confirm your email first. Check your inbox for the link." : "Incorrect email or password.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback`, shouldCreateUser: false, captchaToken: captcha.token },
      });
      // Don't reveal whether the address has an account.
      captcha.reset();
      if (error && isCaptchaError(error.code)) {
        setStatus("idle");
        return setError(CAPTCHA_MESSAGE);
      }
      if (error && error.status !== 400) {
        setStatus("idle");
        setError("We couldn't send the link right now. Please try again in a few minutes.");
        return;
      }
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <AuthCard title="Check your email">
        <FormMessage kind="info">
          If an account exists for {email}, a sign-in link is on its way. Open it in this same browser.
        </FormMessage>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Welcome back" description="Sign in to see how your videos are doing.">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Field label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode === "password" && (
          <PasswordField label="Password" autoComplete="current-password" value={password} onChange={setPassword} />
        )}
        {captcha.widget}
        <Button type="submit" disabled={status === "busy" || !captcha.ready}>
          {status === "busy" ? "Please wait…" : mode === "password" ? "Sign in" : "Email me a sign-in link"}
        </Button>
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <div className="flex flex-col gap-1 text-sm">
          <button type="button" className="self-start underline" onClick={() => { setMode(mode === "password" ? "link" : "password"); setError(""); }}>
            {mode === "password" ? "Email me a sign-in link instead" : "Use my password instead"}
          </button>
          {mode === "password" && <Link className="underline" href="/forgot-password">Forgot your password?</Link>}
          <span className="text-muted-foreground">
            New here? <Link className="underline" href="/signup">Create an account</Link>
          </span>
        </div>
      </form>
    </AuthCard>
  );
}
