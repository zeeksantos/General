"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard, FormMessage } from "@/components/auth/auth-card";
import { Field } from "@/components/auth/field";
import { CAPTCHA_MESSAGE, isCaptchaError, useCaptcha } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { validateName, validatePassword } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<"idle" | "busy" | "confirm">("idle");
  const [error, setError] = useState("");
  const captcha = useCaptcha();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validateName(name) ?? validatePassword(password) ?? (agreed ? null : "Please accept the Terms and Privacy Policy to continue.");
    if (problem) return setError(problem);

    setStatus("busy");
    setError("");
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        captchaToken: captcha.token,
        data: { name: name.trim(), terms_accepted: true }, // consent time is stamped server-side
      },
    });
    if (error) {
      setStatus("idle");
      captcha.reset();
      if (isCaptchaError(error.code)) return setError(CAPTCHA_MESSAGE);
      setError(error.code === "weak_password" ? "That password is too easy to guess. Try a longer one." : "We couldn't create your account. Please check your details and try again.");
      return;
    }
    if (data.session) {
      router.replace("/dashboard"); // email confirmation is switched off in Supabase
      router.refresh();
    } else {
      setStatus("confirm");
    }
  }

  if (status === "confirm") {
    return (
      <AuthCard title="Check your email">
        <FormMessage kind="info">
          We sent a confirmation link to {email}. Open it in this browser to finish creating your account.
          If it doesn&apos;t arrive in a few minutes, check your spam folder.
        </FormMessage>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your account" description="See which of your Facebook and Instagram videos perform best.">
      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        <Field label="Your name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          label="Password" type="password" required autoComplete="new-password"
          hint="At least 10 characters, with a letter and a number."
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>
            I agree to the <Link className="underline" href="/terms" target="_blank">Terms of Service</Link> and{" "}
            <Link className="underline" href="/privacy" target="_blank">Privacy Policy</Link>.
          </span>
        </label>
        {captcha.widget}
        <Button type="submit" disabled={status === "busy" || !captcha.ready}>{status === "busy" ? "Creating account…" : "Create account"}</Button>
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <span className="text-sm text-muted-foreground">
          Already have an account? <Link className="underline" href="/login">Sign in</Link>
        </span>
      </form>
    </AuthCard>
  );
}
