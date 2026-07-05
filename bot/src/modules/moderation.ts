import type { BotModerationCase } from "@prisma/client";
import { prisma } from "../services/prisma";
import { toJson } from "../utils/json";

async function nextCaseNumber(guildId: string) {
  const count = await prisma.botModerationCase.count({ where: { guildId } });
  const base = count + 1;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = `MXF-MOD-${String(base + attempt).padStart(4, "0")}`;
    const existing = await prisma.botModerationCase.findUnique({ where: { caseNumber: candidate } });
    if (!existing) return candidate;
  }

  return `MXF-MOD-${Date.now()}`;
}

export async function createModerationCase(input: {
  guildId: string;
  moderatorId: string;
  targetId: string;
  action: string;
  reason?: string;
  durationSeconds?: number;
  evidence?: unknown[];
  status?: string;
}) {
  return prisma.botModerationCase.create({
    data: {
      caseNumber: await nextCaseNumber(input.guildId),
      guildId: input.guildId,
      moderatorId: input.moderatorId,
      targetId: input.targetId,
      action: input.action,
      reason: input.reason || "No reason provided",
      durationSeconds: input.durationSeconds,
      evidenceJson: toJson(input.evidence || []),
      status: input.status || "Open",
    },
  });
}

export async function warnUser(input: {
  guildId: string;
  moderatorId: string;
  targetId: string;
  reason?: string;
}) {
  const moderationCase = await createModerationCase({
    guildId: input.guildId,
    moderatorId: input.moderatorId,
    targetId: input.targetId,
    action: "Warn",
    reason: input.reason,
  });

  const warning = await prisma.botWarning.create({
    data: {
      guildId: input.guildId,
      userId: input.targetId,
      moderatorId: input.moderatorId,
      reason: input.reason || "No reason provided",
      caseId: moderationCase.id,
      active: true,
    },
  });

  return { moderationCase, warning };
}

export async function removeLatestWarning(input: {
  guildId: string;
  moderatorId: string;
  targetId: string;
  reason?: string;
}) {
  const warning = await prisma.botWarning.findFirst({
    where: { guildId: input.guildId, userId: input.targetId, active: true },
    orderBy: { createdAt: "desc" },
  });

  if (!warning) return null;

  await prisma.botWarning.update({
    where: { id: warning.id },
    data: { active: false },
  });

  const moderationCase = await createModerationCase({
    guildId: input.guildId,
    moderatorId: input.moderatorId,
    targetId: input.targetId,
    action: "Unwarn",
    reason: input.reason || "Warning removed",
    status: "Closed",
  });

  return { warning, moderationCase };
}

export function getWarnings(guildId: string, userId: string) {
  return prisma.botWarning.findMany({
    where: { guildId, userId, active: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getCases(guildId: string, targetId?: string) {
  return prisma.botModerationCase.findMany({
    where: { guildId, ...(targetId ? { targetId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function summarizeCase(moderationCase: BotModerationCase) {
  return `${moderationCase.caseNumber} / ${moderationCase.action} / <@${moderationCase.targetId}> / ${moderationCase.reason}`;
}
