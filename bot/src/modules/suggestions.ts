import { prisma } from "../services/prisma";

export function createSuggestion(input: {
  guildId: string;
  channelId?: string;
  messageId?: string;
  authorId: string;
  title: string;
  body: string;
  productCategory?: string;
}) {
  return prisma.botSuggestion.create({
    data: {
      guildId: input.guildId,
      channelId: input.channelId,
      messageId: input.messageId,
      authorId: input.authorId,
      title: input.title,
      body: input.body,
      productCategory: input.productCategory || "General",
      status: "Pending",
    },
  });
}

export function updateSuggestionStatus(input: { id: string; status: string; staffNote?: string }) {
  return prisma.botSuggestion.update({
    where: { id: input.id },
    data: {
      status: input.status,
      staffNote: input.staffNote,
    },
  });
}

export async function voteSuggestion(input: { id: string; direction: "up" | "down" }) {
  return prisma.botSuggestion.update({
    where: { id: input.id },
    data: input.direction === "up" ? { upvotes: { increment: 1 } } : { downvotes: { increment: 1 } },
  });
}

export function listSuggestions(guildId: string) {
  return prisma.botSuggestion.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
}
