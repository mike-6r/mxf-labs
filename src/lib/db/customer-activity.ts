import { prisma } from "@/lib/db/prisma";

export async function logCustomerActivity({
  customerId,
  action,
  entityType,
  entityId,
  metadata = {},
}: {
  customerId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return prisma.customerActivity.create({
    data: {
      customerId,
      action,
      entityType,
      entityId,
      metadata: JSON.stringify(metadata),
    },
  });
}
