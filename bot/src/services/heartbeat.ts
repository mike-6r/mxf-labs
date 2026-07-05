import type { Client } from "discord.js";
import { botEnv } from "../config/env";
import { prisma } from "./prisma";
import type { WebsiteApiClient } from "./website-api";

export async function sendHeartbeat(input: {
  client: Client;
  website: WebsiteApiClient;
  commandCount: number;
  status?: string;
  lastSyncAt?: Date;
}) {
  const payload = {
    status: input.status || (input.client.isReady() ? "Online" : "Starting"),
    guildCount: input.client.guilds.cache.size,
    commandCount: input.commandCount,
    latencyMs: Math.max(0, Math.round(input.client.ws.ping || 0)),
    websiteApiStatus: "Checking",
    licenseApiStatus: "Checking",
    lastSyncAt: input.lastSyncAt?.toISOString(),
    version: "0.1.0",
    metadata: {
      localMode: botEnv.localMode,
      uptimeSeconds: Math.round(process.uptime()),
    },
  };

  const sync = await input.website.sync("heartbeat");
  const heartbeatPayload = {
    ...payload,
    websiteApiStatus: sync.ok ? "Ready" : "Unavailable",
    licenseApiStatus: sync.ok ? "Ready" : "Unknown",
  };

  const heartbeat = await input.website.heartbeat(heartbeatPayload);
  if (!heartbeat.ok) {
    await prisma.botHeartbeat.create({
      data: {
        botId: "mxf-labs-bot",
        status: heartbeatPayload.status,
        guildCount: heartbeatPayload.guildCount,
        commandCount: heartbeatPayload.commandCount,
        latencyMs: heartbeatPayload.latencyMs,
        websiteApiStatus: heartbeatPayload.websiteApiStatus,
        licenseApiStatus: heartbeatPayload.licenseApiStatus,
        lastSyncAt: input.lastSyncAt,
        version: heartbeatPayload.version,
        metadataJson: JSON.stringify({ fallback: true, message: heartbeat.message }),
      },
    });
  }

  return heartbeatPayload;
}
