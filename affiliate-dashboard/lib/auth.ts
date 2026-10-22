export const MIN_PASSWORD_LENGTH = 10;

/** Returns an error message for a weak password, or null if acceptable. */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password.length > 72) return "Use 72 characters or fewer.";
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return "Include at least one letter and one number.";
  return null;
}

/**
 * Only allow redirects to paths inside this site. Blocks open redirects such as
 * "//evil.com", "/\\evil.com" and "https://evil.com" in the `next` query parameter.
 */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}

export function validateName(name: string): string | null {
  const n = name.trim();
  if (!n) return "Please enter your name.";
  if (n.length > 80) return "Use 80 characters or fewer.";
  return null;
}

export type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: "Too short" | "Weak" | "Okay" | "Good" | "Strong" };

const COMMON = ["password", "passw0rd", "qwerty", "letmein", "welcome", "admin", "iloveyou", "12345", "abcde", "zfast"];

/**
 * Quick feedback while typing; the hard rules stay in validatePassword (and in Supabase).
 * Rewards length and variety, penalises common words and repeated characters.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (password.length < MIN_PASSWORD_LENGTH) return { score: 0, label: "Too short" };
  let points = 0;
  if (password.length >= 12) points++;
  if (password.length >= 16) points++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++;
  if (/\d/.test(password) && /[a-z]/i.test(password)) points++;
  if (/[^a-z0-9]/i.test(password)) points++;
  const lower = password.toLowerCase();
  if (COMMON.some((w) => lower.includes(w)) || /(.)\1{3,}/.test(password) || new Set(password).size <= 4) points = Math.min(points, 1);
  const score = (points <= 1 ? 1 : points === 2 ? 2 : points === 3 ? 3 : 4) as 1 | 2 | 3 | 4;
  return { score, label: (["Weak", "Okay", "Good", "Strong"] as const)[score - 1] };
}

/** The three rules shown as a live checklist. */
export function passwordChecks(password: string) {
  return [
    { label: `At least ${MIN_PASSWORD_LENGTH} characters`, ok: password.length >= MIN_PASSWORD_LENGTH },
    { label: "A letter", ok: /[a-z]/i.test(password) },
    { label: "A number", ok: /\d/.test(password) },
  ];
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
