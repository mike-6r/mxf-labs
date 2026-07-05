import { prisma } from "../services/prisma";
import { parseJson, toJson } from "../utils/json";

export async function createGiveaway(input: {
  guildId: string;
  channelId?: string;
  messageId?: string;
  createdById: string;
  prize: string;
  winnerCount: number;
  durationMinutes: number;
  requirements?: Record<string, unknown>;
  websiteProductSlug?: string;
}) {
  return prisma.botGiveaway.create({
    data: {
      guildId: input.guildId,
      channelId: input.channelId,
      messageId: input.messageId,
      createdById: input.createdById,
      prize: input.prize,
      winnerCount: input.winnerCount,
      endsAt: new Date(Date.now() + input.durationMinutes * 60 * 1000),
      requirementsJson: toJson(input.requirements || {}),
      websiteProductSlug: input.websiteProductSlug,
    },
  });
}

export async function enterGiveaway(giveawayId: string, userId: string) {
  return prisma.botGiveawayEntry.upsert({
    where: { giveawayId_userId: { giveawayId, userId } },
    update: {},
    create: { giveawayId, userId },
  });
}

export async function endGiveaway(giveawayId: string) {
  const giveaway = await prisma.botGiveaway.findUnique({
    where: { id: giveawayId },
    include: { entries: true },
  });

  if (!giveaway) return null;

  const shuffled = [...giveaway.entries].sort(() => Math.random() - 0.5);
  const winners = shuffled.slice(0, giveaway.winnerCount).map((entry) => entry.userId);

  return prisma.botGiveaway.update({
    where: { id: giveawayId },
    data: {
      status: "Ended",
      winnersJson: toJson(winners),
    },
  });
}

export async function rerollGiveaway(giveawayId: string) {
  const giveaway = await prisma.botGiveaway.findUnique({
    where: { id: giveawayId },
    include: { entries: true },
  });

  if (!giveaway) return null;

  const previous = new Set(parseJson<string[]>(giveaway.winnersJson, []));
  const candidates = giveaway.entries.filter((entry) => !previous.has(entry.userId));
  const winners = candidates.sort(() => Math.random() - 0.5).slice(0, giveaway.winnerCount).map((entry) => entry.userId);

  return prisma.botGiveaway.update({
    where: { id: giveawayId },
    data: { winnersJson: toJson(winners.length ? winners : [...previous]) },
  });
}

export function listGiveaways(guildId: string) {
  return prisma.botGiveaway.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
}
