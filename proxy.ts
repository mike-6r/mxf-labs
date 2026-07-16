import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionValue } from "@/lib/auth/session";
import { prelaunchModeEnabled } from "@/lib/launch-mode";
import { crossSiteAdminResponse } from "@/lib/security/admin-origin";

const publicAdminPaths = ["/admin/login", "/api/admin/auth/login"];
const prelaunchAllowedPrefixes = ["/api", "/admin", "/portal"];

function publicLaunchGate(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!prelaunchModeEnabled()) {
    return null;
  }

  if (pathname === "/" || prelaunchAllowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }

  const homeUrl = new URL("/", request.url);
  return NextResponse.redirect(homeUrl);
}

async function adminProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  const crossSiteResponse = isAdminApi ? crossSiteAdminResponse(request.headers, request.method, request.nextUrl.origin) : null;
  if (crossSiteResponse) return crossSiteResponse;

  if (publicAdminPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!isAdminPage && !isAdminApi) {
    return publicLaunchGate(request) || NextResponse.next();
  }

  const session = await verifyAdminSessionValue(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

  if (session) {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const proxy = adminProxy;
export const middleware = adminProxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|txt|xml)$).*)",
  ],
};
