import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_MODE } from "@/lib/config";
import { buildLoginUrl } from "@/lib/meta/oauth";

export async function GET(request: NextRequest) {
  if (DEMO_MODE) return NextResponse.redirect(new URL("/dashboard?connect_error=demo", request.url));
  // The proxy already requires a signed-in user. `state` guards against CSRF.
  const state = randomBytes(24).toString("hex");
  const res = NextResponse.redirect(buildLoginUrl(state));
  res.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/api/meta",
    maxAge: 600,
  });
  return res;
}
