import type { Guild, GuildMember, User } from "discord.js";
import { prisma } from "../services/prisma";

export async function riskUser(input: { guildId: string; user: User; member?: GuildMember | null }) {
  const [warnings, cases, flags, cachedCustomer] = await Promise.all([
    prisma.botWarning.count({ where: { guildId: input.guildId, userId: input.user.id, active: true } }),
    prisma.botModerationCase.count({ where: { guildId: input.guildId, targetId: input.user.id } }),
    prisma.suspiciousActivityFlag.count({ where: { customer: { discordId: input.user.id }, status: "Open" } }),
    prisma.botCachedCustomer.findUnique({ where: { discordId: input.user.id } }),
  ]);

  const accountAgeDays = Math.floor((Date.now() - input.user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const joinAgeDays = input.member?.joinedAt
    ? Math.floor((Date.now() - input.member.joinedAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  let score = 0;
  if (accountAgeDays < 7) score += 20;
  if (joinAgeDays !== null && joinAgeDays < 1) score += 15;
  score += warnings * 10;
  score += cases * 7;
  score += flags * 20;
  if (!cachedCustomer) score += 5;

  const level = score >= 70 ? "High" : score >= 35 ? "Medium" : "Low";
  return { score, level, warnings, cases, flags, accountAgeDays, joinAgeDays, linkedCustomer: Boolean(cachedCustomer) };
}

export async function riskServer(guild: Guild) {
  const [warnings, cases, openTickets, activeGiveaways] = await Promise.all([
    prisma.botWarning.count({ where: { guildId: guild.id, active: true } }),
    prisma.botModerationCase.count({ where: { guildId: guild.id } }),
    prisma.botTicket.count({ where: { guildId: guild.id, status: { not: "Closed" } } }),
    prisma.botGiveaway.count({ where: { guildId: guild.id, status: "Active" } }),
  ]);

  const memberCount = guild.memberCount;
  const score = Math.min(100, warnings * 2 + cases + openTickets + activeGiveaways);
  const level = score >= 70 ? "High" : score >= 35 ? "Medium" : "Low";
  return { score, level, warnings, cases, openTickets, activeGiveaways, memberCount };
}
