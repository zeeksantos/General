"use client";

import { useEffect, useRef, useState } from "react";

// Cloudflare Turnstile. Inactive unless NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so the forms keep working
// while CAPTCHA protection is switched off in Supabase. When it IS switched on there, the key must be set here
// or every sign-up / sign-in is rejected.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const TURNSTILE_ENABLED = Boolean(SITE_KEY);

type TurnstileApi = {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
};
declare global {
  interface Window { turnstile?: TurnstileApi }
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error("turnstile failed to load")); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

function Turnstile({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey: number }) {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          theme: "auto",
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  // Tokens are single-use: the parent bumps resetKey after every attempt to get a fresh one.
  useEffect(() => {
    if (resetKey > 0 && widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
      onTokenRef.current(null);
    }
  }, [resetKey]);

  return (
    <div>
      <div ref={box} />
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          We couldn&apos;t load the security check. Disable ad blockers for this site and refresh the page.
        </p>
      )}
    </div>
  );
}

/** `widget` goes inside the form; pass `token` as `captchaToken`; call `reset()` after every attempt. */
export function useCaptcha() {
  const [token, setToken] = useState<string | null>(null);
  const [n, setN] = useState(0);
  return {
    token: token ?? undefined,
    widget: TURNSTILE_ENABLED ? <Turnstile onToken={setToken} resetKey={n} /> : null,
    reset: () => setN((x) => x + 1),
    /** false while the check is still running (submit stays disabled) */
    ready: !TURNSTILE_ENABLED || token !== null,
  };
}

export const isCaptchaError = (code?: string) => code === "captcha_failed";
export const CAPTCHA_MESSAGE = "The security check failed. Please try again.";
