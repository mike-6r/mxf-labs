import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, hashSessionValue } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export type AdminSessionSummary = {
  id: string;
  current: boolean;
  createdAt: string;
  expiresAt: string;
};

export async function getCurrentAdminSessionHash() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return sessionValue ? hashSessionValue(sessionValue) : "";
}

export async function getAdminSessionSummaries(adminUserId: string): Promise<AdminSessionSummary[]> {
  const currentHash = await getCurrentAdminSessionHash();

  await prisma.adminSession.deleteMany({
    where: {
      adminUserId,
      expiresAt: { lte: new Date() },
    },
  });

  const sessions = await prisma.adminSession.findMany({
    where: {
      adminUserId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  return sessions.map((session) => ({
    id: session.id,
    current: Boolean(currentHash && session.tokenHash === currentHash),
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  }));
}

export async function revokeAdminSession(adminUserId: string, sessionId: string) {
  const currentHash = await getCurrentAdminSessionHash();
  const session = await prisma.adminSession.findFirst({
    where: {
      id: sessionId,
      adminUserId,
    },
  });

  if (!session) {
    return { revoked: 0, current: false };
  }

  const result = await prisma.adminSession.deleteMany({
    where: {
      id: sessionId,
      adminUserId,
    },
  });

  return {
    revoked: result.count,
    current: Boolean(currentHash && session.tokenHash === currentHash),
  };
}

export async function revokeOtherAdminSessions(adminUserId: string) {
  const currentHash = await getCurrentAdminSessionHash();

  const result = await prisma.adminSession.deleteMany({
    where: {
      adminUserId,
      tokenHash: currentHash ? { not: currentHash } : undefined,
    },
  });

  return result.count;
}
