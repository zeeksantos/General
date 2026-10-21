import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForLongLivedToken } from "@/lib/meta/oauth";
import { storeToken } from "@/lib/meta/tokens";

const PENDING_COOKIE = "meta_pending_token";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const fail = (reason: string) => {
    const res = NextResponse.redirect(`${origin}/dashboard?connect_error=${reason}`);
    res.cookies.delete({ name: "meta_oauth_state", path: "/api/meta" });
    return res;
  };

  const expected = request.cookies.get("meta_oauth_state")?.value;
  if (!expected || searchParams.get("state") !== expected) return fail("state");
  if (searchParams.get("error")) return fail("denied");
  const code = searchParams.get("code");
  if (!code) return fail("denied");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  try {
    const userToken = await exchangeCodeForLongLivedToken(code);
    // Park the long-lived user token in Vault; only its (unguessable) id travels in a cookie.
    const secretId = await storeToken(userToken, `meta-pending-${user.id}-${Date.now()}`, "pending page selection");

    const res = NextResponse.redirect(`${origin}/connect/pick`);
    res.cookies.delete({ name: "meta_oauth_state", path: "/api/meta" });
    res.cookies.set(PENDING_COOKIE, secretId, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/connect",
      maxAge: 900,
    });
    return res;
  } catch {
    return fail("exchange");
  }
}
