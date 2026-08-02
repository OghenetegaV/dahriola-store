// middleware.ts   (place at the PROJECT ROOT, next to package.json — not inside src/)
// ─────────────────────────────────────────────────────────────────────────────
// Maintenance mode toggle.
//
// Turn the store OFF (show maintenance page):  set  MAINTENANCE_MODE=on   in Vercel
// Turn the store back ON (normal site):        set  MAINTENANCE_MODE=off  (or remove it)
// then redeploy — or just change the env var and Vercel re-runs.
//
// While ON, every visitor is rewritten to /maintenance EXCEPT:
//   • the /maintenance page itself
//   • Next.js internals and static assets
//   • the Paystack payment callback / API routes (so in-flight orders can still
//     complete and you can keep testing checkout privately)
//
// You (the owner) can still preview the real site by adding ?preview=<secret>
// to any URL, where <secret> matches MAINTENANCE_BYPASS_TOKEN. The bypass is
// remembered for the session via a cookie.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from "next/server";

const BYPASS_COOKIE = "mnt_bypass";

export function middleware(request: NextRequest) {
  const isOn = process.env.MAINTENANCE_MODE === "on";
  if (!isOn) return NextResponse.next();

  const { pathname, searchParams } = request.nextUrl;

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
