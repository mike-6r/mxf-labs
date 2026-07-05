import { createSignedValue, hashSessionValue, verifySignedValue } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getNumberSetting } from "@/lib/db/settings";

type DownloadTokenPayload = {
  sub: string;
  downloadId: string;
  exp: number;
};

export async function createDownloadToken({
  customerId,
  downloadId,
  ipAddress,
  userAgent,
}: {
  customerId: string;
  downloadId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const ttlMinutes = await getNumberSetting("downloads.token_ttl_minutes");
  const expiresAt = new Date(Date.now() + Math.max(1, ttlMinutes) * 60 * 1000);
  const token = await createSignedValue({
    sub: customerId,
    downloadId,
    exp: Math.floor(expiresAt.getTime() / 1000),
  });

  await prisma.downloadToken.create({
    data: {
      tokenHash: await hashSessionValue(token),
      customerId,
      downloadId,
      ipAddress,
      userAgent,
      expiresAt,
    },
  });

  return token;
}

export async function consumeDownloadToken({
  token,
  customerId,
  downloadId,
}: {
  token?: string | null;
  customerId: string;
  downloadId: string;
}) {
  const payload = await verifySignedValue<DownloadTokenPayload>(token);
  if (!payload || payload.sub !== customerId || payload.downloadId !== downloadId) {
    return null;
  }

  const stored = await prisma.downloadToken.findFirst({
    where: {
      tokenHash: await hashSessionValue(token || ""),
      customerId,
      downloadId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!stored) {
    return null;
  }

  return prisma.downloadToken.update({
    where: { id: stored.id },
    data: { usedAt: new Date() },
  });
}
