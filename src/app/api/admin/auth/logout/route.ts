import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, hashSessionValue } from "@/lib/auth/session";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  const { admin, response } = await requireAdminApi();

  if (response) {
    return response;
  }

  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (sessionValue) {
    await prisma.adminSession
      .deleteMany({ where: { tokenHash: await hashSessionValue(sessionValue) } })
      .catch(() => undefined);
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE);

  await logActivity({
    actorEmail: admin.email,
    action: "logged out",
    entityType: "AdminUser",
    entityId: admin.id,
  });

  return NextResponse.json({ ok: true });
}
