import "dotenv/config";

function clean(value: string | undefined, fallback = "") {
  return (value || fallback).trim();
}

function cleanSecret(...values: Array<string | undefined>) {
  return values.map((value) => clean(value)).find((value) => value && value !== "replace-with-a-private-bot-api-key") || "";
}

function cleanUrl(value: string | undefined, fallback: string) {
  return clean(value, fallback).replace(/\/+$/, "");
}

function asBoolean(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function asNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const botEnv = {
  brand: "MxF Labs",
  token: clean(process.env.DISCORD_BOT_TOKEN),
  clientId: clean(process.env.DISCORD_CLIENT_ID),
  guildId: clean(process.env.DISCORD_GUILD_ID),
  apiBaseUrl: cleanUrl(process.env.MXF_API_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000"),
  apiKey: cleanSecret(process.env.MXF_BOT_API_KEY, process.env.DISCORD_BOT_API_KEY),
  localMode: asBoolean(process.env.BOT_LOCAL_MODE, true),
  registerCommandsOnStart: asBoolean(process.env.BOT_REGISTER_COMMANDS_ON_START, false),
  heartbeatIntervalSeconds: asNumber(process.env.BOT_HEARTBEAT_INTERVAL_SECONDS, 60),
  ownerIds: clean(process.env.BOT_OWNER_IDS)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
};

export function runtimeConfigStatus() {
  return {
    hasToken: Boolean(botEnv.token),
    hasClientId: Boolean(botEnv.clientId),
    hasGuildId: Boolean(botEnv.guildId),
    hasApiBaseUrl: Boolean(botEnv.apiBaseUrl),
    hasApiKey: Boolean(botEnv.apiKey),
    localMode: botEnv.localMode,
  };
}

export function requireBotRuntimeConfig(options: { allowLocal?: boolean } = {}) {
  const allowLocal = options.allowLocal ?? botEnv.localMode;
  const missing = [];

  if (!botEnv.apiBaseUrl) missing.push("MXF_API_BASE_URL");
  if (!botEnv.apiKey) missing.push("MXF_BOT_API_KEY or DISCORD_BOT_API_KEY");
  if (!allowLocal && !botEnv.token) missing.push("DISCORD_BOT_TOKEN");
  if (!allowLocal && !botEnv.clientId) missing.push("DISCORD_CLIENT_ID");

  if (missing.length) {
    throw new Error(`Missing bot configuration: ${missing.join(", ")}`);
  }
}
