import { prisma } from "../services/prisma";
import { parseJson } from "../utils/json";
import { createModerationCase, warnUser } from "./moderation";

export type AutomodInput = {
  guildId: string;
  authorId: string;
  content: string;
  mentionCount?: number;
  accountCreatedAt?: Date;
  joinedAt?: Date | null;
  recentMessages?: string[];
};

export type AutomodDetection = {
  type: string;
  severity: "Low" | "Medium" | "High";
  detail: string;
};

const invitePattern = /(discord\.gg\/|discord\.com\/invite\/)/i;
const phishingPattern = /(free\s+nitro|steamcommunity\.gift|airdrop|verify\s+wallet|mfa\.[\w-]{20,})/i;
const suspiciousTokenPattern = /[\w-]{24,}\.[\w-]{6,}\.[\w-]{20,}/;
const urlPattern = /https?:\/\/\S+/gi;

export function analyzeMessage(input: AutomodInput, config: Record<string, unknown> = {}) {
  const detections: AutomodDetection[] = [];
  const content = input.content.trim();
  const lower = content.toLowerCase();
  const blockedWords = Array.isArray(config.blockedWords) ? config.blockedWords.map(String) : [];
  const massMentionLimit = typeof config.massMentions === "number" ? config.massMentions : 6;
  const capsRatio = typeof config.capsRatio === "number" ? config.capsRatio : 0.7;

  if (invitePattern.test(content)) {
    detections.push({ type: "invite_link", severity: "Medium", detail: "Discord invite link detected." });
  }

  if (phishingPattern.test(content) || suspiciousTokenPattern.test(content)) {
    detections.push({ type: "scam_or_token_pattern", severity: "High", detail: "Phishing or token-like pattern detected." });
  }

  if ((input.mentionCount || 0) >= massMentionLimit) {
    detections.push({ type: "mass_mentions", severity: "High", detail: `${input.mentionCount} mentions in one message.` });
  }

  const links = content.match(urlPattern) || [];
  if (links.length >= 4) {
    detections.push({ type: "link_spam", severity: "Medium", detail: `${links.length} links in one message.` });
  }

  const letters = content.replace(/[^a-z]/gi, "");
  const caps = letters.replace(/[^A-Z]/g, "");
  if (letters.length >= 18 && caps.length / letters.length >= capsRatio) {
    detections.push({ type: "excessive_caps", severity: "Low", detail: "High uppercase ratio." });
  }

  if (blockedWords.some((word) => word && lower.includes(word.toLowerCase()))) {
    detections.push({ type: "blacklisted_word", severity: "Medium", detail: "Configured blocked term detected." });
  }

  if (input.recentMessages?.filter((message) => message === content).length) {
    detections.push({ type: "duplicate_message", severity: "Medium", detail: "Duplicate message in the configured window." });
  }

  if (input.accountCreatedAt && Date.now() - input.accountCreatedAt.getTime() < 1000 * 60 * 60 * 24) {
    detections.push({ type: "new_account", severity: "Low", detail: "Account is less than 24 hours old." });
  }

  const score = detections.reduce((total, detection) => {
    if (detection.severity === "High") return total + 5;
    if (detection.severity === "Medium") return total + 3;
    return total + 1;
  }, 0);

  const action = score >= 8 ? "timeout" : score >= 5 ? "warn" : score > 0 ? "log" : "allow";
  return { detections, score, action };
}

export async function runAutomod(input: AutomodInput) {
  const config = await prisma.botGuildConfig.findUnique({ where: { guildId: input.guildId } });
  if (config && !config.automodEnabled) {
    return { detections: [], score: 0, action: "allow" };
  }

  const result = analyzeMessage(input, parseJson<Record<string, unknown>>(config?.automodConfigJson, {}));

  if (result.action === "warn") {
    await warnUser({
      guildId: input.guildId,
      moderatorId: "automod",
      targetId: input.authorId,
      reason: result.detections.map((item) => item.type).join(", "),
    });
  }

  if (result.action === "timeout" || result.action === "log") {
    await createModerationCase({
      guildId: input.guildId,
      moderatorId: "automod",
      targetId: input.authorId,
      action: `AutoMod ${result.action}`,
      reason: result.detections.map((item) => item.type).join(", "),
      evidence: result.detections,
    });
  }

  return result;
}
