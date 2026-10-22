"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { AuthCard, FormMessage } from "@/components/auth/auth-card";
import { Field } from "@/components/auth/field";
import { PasswordField } from "@/components/auth/password-field";
import { CAPTCHA_MESSAGE, isCaptchaError, useCaptcha } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { isValidEmail, validateName, validatePassword } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

type Errors = { name?: string; email?: string; password?: string; terms?: string; form?: string };

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<"idle" | "busy" | "confirm">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const captcha = useCaptcha();
  // Editing a field clears its own error straight away (and any form-level error).
  const clear = (field: keyof Errors) => setErrors((e) => ({ ...e, [field]: undefined, form: undefined }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found: Errors = {
      name: validateName(name) ?? undefined,
      email: isValidEmail(email) ? undefined : "Enter a valid email address.",
      password: validatePassword(password) ?? undefined,
      terms: agreed ? undefined : "Please accept the Terms and Privacy Policy to continue.",
    };
    if (Object.values(found).some(Boolean)) return setErrors(found);

    setStatus("busy");
    setErrors({});
    const { data, error } = await createClient().auth.signUp({
      email: email.trim(),
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
      if (isCaptchaError(error.code)) return setErrors({ form: CAPTCHA_MESSAGE });
      if (error.code === "weak_password") return setErrors({ password: "That password is too easy to guess. Try a longer one." });
      return setErrors({ form: "We couldn't create your account. Please check your details and try again." });
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
        <div className="flex flex-col gap-4">
          <MailCheck className="h-10 w-10 text-emerald-600" aria-hidden />
          <FormMessage kind="info">
            We sent a confirmation link to <strong>{email}</strong>. Open it <strong>in this browser</strong> to finish creating your account.
          </FormMessage>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            <li>It can take a few minutes to arrive. Check your spam folder too.</li>
            <li>Typed the wrong address? Go back and start again.</li>
          </ul>
          <Button variant="outline" className="self-start" onClick={() => setStatus("idle")}>Use a different email</Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your account" description="It takes a minute. You'll connect your Facebook and Instagram after.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Your name" required autoComplete="name" value={name} error={errors.name} onChange={(e) => { setName(e.target.value); clear("name"); }} />
        <Field label="Email" type="email" required autoComplete="email" value={email} error={errors.email} onChange={(e) => { setEmail(e.target.value); clear("email"); }} />
        <PasswordField label="Password" autoComplete="new-password" showMeter value={password} error={errors.password} onChange={(v) => { setPassword(v); clear("password"); }} />
        <div className="flex flex-col gap-1">
          <label className="flex items-start gap-2.5 text-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); clear("terms"); }} aria-invalid={errors.terms ? true : undefined} />
            <span>
              I agree to the <Link className="underline" href="/terms" target="_blank">Terms of Service</Link> and{" "}
              <Link className="underline" href="/privacy" target="_blank">Privacy Policy</Link>.
            </span>
          </label>
          {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
        </div>
        {captcha.widget}
        <Button type="submit" disabled={status === "busy" || !captcha.ready}>{status === "busy" ? "Creating account…" : "Create account"}</Button>
        {errors.form && <FormMessage kind="error">{errors.form}</FormMessage>}
        <p className="text-sm text-muted-foreground">Already have an account? <Link className="underline" href="/login">Sign in</Link></p>
      </form>
    </AuthCard>
  );
}
