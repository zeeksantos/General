import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_MODE } from "@/lib/config";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/auth", "/privacy", "/terms", "/data-deletion"];
const GUEST_ONLY = ["/login", "/signup", "/forgot-password"];

// Refreshes the Supabase session and gates everything except public paths.
export async function updateSession(request: NextRequest) {
  if (DEMO_MODE) {
    // No login in demo mode (all data is fake); /login just goes to the dashboard.
    if (GUEST_ONLY.includes(request.nextUrl.pathname)) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next({ request });
  }
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!data?.claims && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (data?.claims && GUEST_ONLY.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  return response;
}
