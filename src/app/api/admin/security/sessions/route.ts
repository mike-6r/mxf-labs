import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import {
  getAdminSessionSummaries,
  revokeAdminSession,
  revokeOtherAdminSessions,
} from "@/lib/auth/admin-sessions";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth/session";
import { logActivity } from "@/lib/db/activity";
import { requestIp } from "@/lib/request/ip";

export async function GET() {
  const { admin, response } = await requireAdminApi("settings.manage");
  if (response) return response;

  return NextResponse.json({ ok: true, sessions: await getAdminSessionSummaries(admin.id) });
}

export async function POST(request: Request) {
  const { admin, response } = await requireAdminApi("settings.manage");
  if (response) return response;

  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "";
  const ipAddress = requestIp(request);

  if (action === "revoke") {
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    if (!sessionId) {
      return NextResponse.json({ ok: false, message: "Session ID is required." }, { status: 400 });
    }

    const result = await revokeAdminSession(admin.id, sessionId);
    if (!result.revoked) {
      return NextResponse.json({ ok: false, message: "Session was not found." }, { status: 404 });
    }

    if (result.current) {
      const cookieStore = await cookies();
      cookieStore.delete(ADMIN_SESSION_COOKIE);
    }

    await logActivity({
      actorEmail: admin.email,
      action: result.current ? "revoked current admin session" : "revoked admin session",
      entityType: "AdminSession",
      entityId: sessionId,
      metadata: { ipAddress },
    });

    return NextResponse.json({
      ok: true,
      revoked: result.revoked,
      loggedOut: result.current,
      sessions: result.current ? [] : await getAdminSessionSummaries(admin.id),
    });
  }

  if (action === "revoke-others") {
    const revoked = await revokeOtherAdminSessions(admin.id);

    await logActivity({
      actorEmail: admin.email,
      action: "revoked other admin sessions",
      entityType: "AdminUser",
      entityId: admin.id,
      metadata: { revoked, ipAddress },
    });

    return NextResponse.json({ ok: true, revoked, sessions: await getAdminSessionSummaries(admin.id) });
  }

  return NextResponse.json({ ok: false, message: "Unsupported session action." }, { status: 400 });
}
