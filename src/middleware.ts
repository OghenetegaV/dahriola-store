import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get("authorization");

  const username = process.env.SITE_USERNAME;
  const password = process.env.SITE_PASSWORD;

  if (basicAuth) {
    const authValue = basicAuth.split(" ")[1];
    const [user, pass] = atob(authValue).split(":");

    if (user === username && pass === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};