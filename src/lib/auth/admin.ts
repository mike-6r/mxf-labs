import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, hashSessionValue, verifyAdminSessionValue } from "@/lib/auth/session";
import type { AdminPermission } from "@/lib/auth/rbac";
import { canAdmin } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifyAdminSessionValue(sessionValue);

  if (!session) {
    return null;
  }

  const storedSession = await prisma.adminSession.findFirst({
    where: {
      tokenHash: await hashSessionValue(sessionValue || ""),
      expiresAt: {
        gt: new Date(),
      },
      adminUser: {
        id: session.sub,
        email: session.email,
        isActive: true,
      },
    },
    include: {
      adminUser: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          permissionsJson: true,
          createdAt: true,
        },
      },
    },
  });

  return storedSession?.adminUser || null;
}

export async function requireAdmin(permission?: AdminPermission) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    throw new Error("Unauthorized");
  }

  if (permission && !canAdmin(admin, permission)) {
    throw new Error("Forbidden");
  }

  return admin;
}

export async function requireAdminApi(permission?: AdminPermission) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return {
      admin: null,
      response: NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (permission && !canAdmin(admin, permission)) {
    return {
      admin,
      response: NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 }),
    };
  }

  return { admin, response: null };
}
