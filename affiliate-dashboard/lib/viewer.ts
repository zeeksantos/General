import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { DEMO_MODE } from "./config";
import { DEMO_VIEWER_ID } from "./demo/data";
import { createClient } from "./supabase/server";

export type Viewer = {
  id: string; name: string; email: string | null;
  role: "affiliate" | "admin";
  status: "pending" | "active" | "suspended";
};

// In demo mode there is no login; the viewer is a fake creator who can also open the admin view.
const DEMO_VIEWER: Viewer = { id: DEMO_VIEWER_ID, name: "Maria Santos", email: null, role: "admin", status: "active" };
// Demo only: DEMO_VIEWER_STATUS=pending|suspended previews the waiting / suspended screens.
const DEMO_STATUS = process.env.DEMO_VIEWER_STATUS === "pending" || process.env.DEMO_VIEWER_STATUS === "suspended" ? process.env.DEMO_VIEWER_STATUS : "active";

/** The signed-in user and their role, or null. Cached per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (DEMO_MODE) {
    await connection(); // demo pages use the current time, so render per request (real mode does this via cookies)
    return { ...DEMO_VIEWER, status: DEMO_STATUS };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("name, role, status").eq("id", user.id).single();
  return { id: user.id, email: user.email ?? null, name: profile?.name ?? "", role: profile?.role === "admin" && profile?.status === "active" ? "admin" : "affiliate", // only an active admin has powers
    // Anything unexpected is treated as not active: fail closed.
    status: profile?.status === "active" ? "active" : profile?.status === "suspended" ? "suspended" : "pending",
  };
});

/** For server actions and route handlers that act on the user's own data: only approved, non-suspended users. */
export async function getActiveViewer(): Promise<Viewer | null> {
  const viewer = await getViewer();
  return viewer && viewer.status === "active" ? viewer : null;
}
