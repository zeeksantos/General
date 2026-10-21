import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_MODE } from "@/lib/config";
import { deleteConnectionsForMetaUser } from "@/lib/meta/deletion";
import { parseSignedRequest } from "@/lib/meta/signed-request";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Meta "Data Deletion Request Callback". Meta POSTs a form with `signed_request` when someone removes the app
 * and asks for their data to be deleted. We must answer with { url, confirmation_code }.
 */
export async function POST(request: NextRequest) {
  if (DEMO_MODE) return NextResponse.json({ error: "disabled in demo mode" }, { status: 503 });

  const form = await request.formData().catch(() => null);
  const signed = form?.get("signed_request");
  const secret = process.env.META_APP_SECRET;
  if (typeof signed !== "string" || !secret) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const payload = parseSignedRequest(signed, secret);
  if (!payload?.user_id) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

  try {
    const removed = await deleteConnectionsForMetaUser(String(payload.user_id));
    const code = randomBytes(16).toString("hex"); // unguessable: the status page is public
    const { error } = await createAdminClient()
      .from("deletion_requests")
      .insert({ code, status: "completed", connections_deleted: removed });
    if (error) throw new Error("could not record request");

    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
    return NextResponse.json({ url: `${origin}/data-deletion/status?code=${code}`, confirmation_code: code });
  } catch {
    return NextResponse.json({ error: "deletion failed" }, { status: 500 });
  }
}
