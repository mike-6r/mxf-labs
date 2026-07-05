import type { Message } from "discord.js";
import { runAutomod } from "../modules/automod";
import type { BotServices } from "../types/context";

const recentMessages = new Map<string, string[]>();

export async function onMessageCreate(message: Message, services: BotServices) {
  if (!message.guildId || message.author.bot) return;

  const key = `${message.guildId}:${message.author.id}`;
  const recent = recentMessages.get(key) || [];
  const result = await runAutomod({
    guildId: message.guildId,
    authorId: message.author.id,
    content: message.content,
    mentionCount: message.mentions.users.size + message.mentions.roles.size,
    accountCreatedAt: message.author.createdAt,
    joinedAt: message.member?.joinedAt,
    recentMessages: recent,
  });

  recentMessages.set(key, [message.content, ...recent].slice(0, 5));

  if (result.action === "warn" || result.action === "timeout") {
    await message.delete().catch(() => null);
  }

  if (result.action === "timeout") {
    await message.member?.timeout(10 * 60 * 1000, "MxF Labs AutoMod").catch(() => null);
  }

  if (result.detections.length) {
    await services.logger.warn("automod detection", {
      area: "AutoMod",
      guildId: message.guildId,
      actorId: message.author.id,
      action: result.action,
      score: result.score,
      detections: result.detections,
    });
  }
}
