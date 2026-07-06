import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const publicPaths = [
    "/login",
    "/signup",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/",
    "/api/auth/confirm",  // Supabase email confirmation handler
    "/api/auth/callback", // OAuth callback
  ];

  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "?") || pathname.startsWith(p + "/")
  );

  // Also allow all /api/ routes through (they handle their own auth)
  const isApiRoute = pathname.startsWith("/api/");

  if (!user && !isPublicPath && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Don't redirect away from reset-password even if user session exists
  // (user has a temporary recovery session at this point)
  const isResetPassword = pathname === "/reset-password";

  if (user && (pathname === "/login" || pathname === "/signup") && !isResetPassword) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}