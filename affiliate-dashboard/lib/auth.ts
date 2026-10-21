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
