// middleware.ts   (place at the PROJECT ROOT, next to package.json — not inside src/)
// ─────────────────────────────────────────────────────────────────────────────
// 1. Store dashboard (/admin): keeps the signed-in session fresh.
//
// 2. Maintenance mode toggle.
//
// Turn the store OFF (show maintenance page):  set  MAINTENANCE_MODE=on   in Vercel
// Turn the store back ON (normal site):        set  MAINTENANCE_MODE=off  (or remove it)
// then redeploy — or just change the env var and Vercel re-runs.
//
// While ON, every visitor is rewritten to /maintenance EXCEPT:
//   • the /maintenance page itself
//   • the store dashboard (/admin), so orders can still be managed
//   • Next.js internals and static assets
//   • the Paystack payment callback / API routes (so in-flight orders can still
//     complete and you can keep testing checkout privately)
//
// You (the owner) can still preview the real site by adding ?preview=<secret>
// to any URL, where <secret> matches MAINTENANCE_BYPASS_TOKEN. The bypass is
// remembered for the session via a cookie.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const BYPASS_COOKIE = "mnt_bypass";

/** Refreshes the dashboard sign-in cookies when they are close to expiring. */
async function refreshAdminSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser();
  } catch {
    // Supabase unreachable: carry on, the page itself will ask them to sign in
  }
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return refreshAdminSession(request);
  }

  const isOn = process.env.MAINTENANCE_MODE === "on";
  if (!isOn) return NextResponse.next();

  // Always allow: the maintenance page, Next internals, static files, favicon,
  // and API/payment routes so orders & webhooks aren't blocked.
  if (
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/checkout") || // let you keep testing checkout privately
    pathname === "/favicon.ico" ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|txt|woff2?|ttf)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Owner bypass: ?preview=<token> sets a cookie so you can browse normally.
  const token = process.env.MAINTENANCE_BYPASS_TOKEN;
  if (token && searchParams.get("preview") === token) {
    const res = NextResponse.next();
    res.cookies.set(BYPASS_COOKIE, token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 8 });
    return res;
  }
  if (token && request.cookies.get(BYPASS_COOKIE)?.value === token) {
    return NextResponse.next();
  }

  // Everyone else → maintenance page (rewrite keeps the URL they typed).
  const url = request.nextUrl.clone();
  url.pathname = "/maintenance";
  return NextResponse.rewrite(url);
}

// Run on all paths except the ones we already skip above.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
