export type UserRole = "affiliate" | "admin";
export type UserStatus = "pending" | "active" | "suspended";
export type UserAction = "approve" | "suspend" | "reactivate" | "make_admin" | "remove_admin" | "delete";

export type UserRow = {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  accounts: number;
};

/**
 * Returns why an admin may not perform `action` on `target`, or null if it is allowed.
 * Guards against locking yourself (or the whole team) out.
 */
export function checkUserAction(
  actorId: string,
  target: Pick<UserRow, "id" | "role" | "status">,
  action: UserAction,
  activeAdminCount: number,
): string | null {
  const self = actorId === target.id;
  switch (action) {
    case "approve":
      return target.status === "pending" ? null : "Only pending accounts can be approved.";
    case "reactivate":
      return target.status === "suspended" ? null : "Only suspended accounts can be reactivated.";
    case "suspend":
      if (self) return "You can't suspend your own account.";
      if (target.role === "admin") return "Remove admin access before suspending this account.";
      return target.status === "active" ? null : "Only active accounts can be suspended.";
    case "make_admin":
      if (target.role === "admin") return "This account is already an admin.";
      return target.status === "active" ? null : "Approve the account before making it an admin.";
    case "remove_admin":
      if (target.role !== "admin") return "This account isn't an admin.";
      if (self) return "You can't remove your own admin access.";
      return activeAdminCount > 1 ? null : "There must be at least one admin.";
    case "delete":
      if (self) return "Use Settings → Delete my data to delete your own account.";
      if (target.role === "admin") return "Remove admin access before deleting this account.";
      return null;
  }
}

const EMAIL = /^[^\s@,;<>()]+@[^\s@,;<>()]+\.[^\s@,;<>()]{2,}$/;
export const MAX_INVITES = 20;

/** Splits pasted text (commas, semicolons, spaces, new lines) into unique lower-case emails. */
export function parseInviteEmails(text: string): { valid: string[]; invalid: string[]; tooMany: boolean } {
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const raw of text.split(/[\s,;]+/)) {
    const e = raw.trim().toLowerCase();
    if (!e || seen.has(e)) continue;
    seen.add(e);
    (EMAIL.test(e) && e.length <= 254 ? valid : invalid).push(e);
  }
  return { valid: valid.slice(0, MAX_INVITES), invalid, tooMany: valid.length > MAX_INVITES };
}
