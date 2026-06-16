import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = ["/welcome", "/login", "/signup", "/offline"];

/** Static PWA assets — must not go through auth middleware */
const PWA_STATIC_PATHS = [
  "/manifest.json",
  "/sw.js",
  "/offline.html",
  "/favicon.ico",
  "/favicon.png",
];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next();
  const { pathname } = req.nextUrl;

  if (
    PWA_STATIC_PATHS.includes(pathname) ||
    pathname.startsWith("/icons/")
  ) {
    return res;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isApiRoute = pathname.startsWith("/api/");

  if (isApiRoute) return res;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!isPublicRoute) return NextResponse.redirect(new URL("/welcome", req.url));
    return res;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set(name, value);
          res.cookies.set(name, value, options as Record<string, unknown>);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user);

  if (isPublicRoute) {
    if (isLoggedIn && !pathname.startsWith("/offline")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return res;
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|robots.txt|sitemap.xml|manifest.json|sw.js|offline.html|icons/).*)",
  ],
};
