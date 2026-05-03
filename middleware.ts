import { isPreLaunchWaitlistEnabled } from "@/lib/config/preLaunch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Paths reachable while `SUBI_PRE_LAUNCH` is on (everything else redirects or 403). */
function isPreLaunchPublicPath(pathname: string): boolean {
  if (pathname === "/waitlist" || pathname.startsWith("/waitlist/")) return true;
  if (pathname === "/api/waitlist" || pathname.startsWith("/api/waitlist/")) return true;
  // Paystack → server webhook; keep working if checkout is tested during soft open.
  if (pathname === "/api/billing/webhooks/paystack") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  if (isPreLaunchWaitlistEnabled()) {
    const { pathname } = request.nextUrl;
    if (!isPreLaunchPublicPath(pathname)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "SubI is not publicly available yet." },
          { status: 403 },
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/waitlist";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
