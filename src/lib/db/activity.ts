import { prisma } from "@/lib/db/prisma";

export async function logActivity({
  actorEmail,
  action,
  entityType,
  entityId,
  metadata = {},
}: {
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.activityLog.create({
    data: {
      actorEmail,
      action,
      entityType,
      entityId,
      metadata: JSON.stringify(metadata),
    },
  });
}
