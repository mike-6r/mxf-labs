import { prisma } from "./prisma";
import type { WebsiteApiClient } from "./website-api";

export async function queueWebsiteEvent(input: { guildId?: string; eventType: string; payload: unknown }) {
  return prisma.botSyncQueue.create({
    data: {
      guildId: input.guildId,
      eventType: input.eventType,
      payloadJson: JSON.stringify(input.payload || {}),
      status: "Queued",
    },
  });
}

export async function processSyncQueue(website: WebsiteApiClient) {
  const jobs = await prisma.botSyncQueue.findMany({
    where: { status: "Queued", runAfter: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  const results = [];
  for (const job of jobs) {
    try {
      const result = await website.sync(`queue:${job.eventType}`);
      await prisma.botSyncQueue.update({
        where: { id: job.id },
        data: {
          status: result.ok ? "Processed" : "Queued",
          attempts: { increment: 1 },
          lastError: result.ok ? null : result.message,
          processedAt: result.ok ? new Date() : null,
          runAfter: result.ok ? new Date() : new Date(Date.now() + 60_000),
        },
      });
      results.push({ id: job.id, ok: result.ok });
    } catch (error) {
      await prisma.botSyncQueue.update({
        where: { id: job.id },
        data: {
          attempts: { increment: 1 },
          lastError: error instanceof Error ? error.message : "Unknown queue error",
          runAfter: new Date(Date.now() + 60_000),
        },
      });
      results.push({ id: job.id, ok: false });
    }
  }

  return results;
}
