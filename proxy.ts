import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionValue } from "@/lib/auth/session";

const publicAdminPaths = ["/admin/login", "/api/admin/auth/login"];

async function adminProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicAdminPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
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
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
