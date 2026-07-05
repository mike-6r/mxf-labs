import type { Client } from "discord.js";
import { commands } from "../commands";
import { botEnv } from "../config/env";
import { sendHeartbeat } from "../services/heartbeat";
import { processSyncQueue } from "../services/sync-queue";
import type { BotServices } from "../types/context";

export async function onReady(client: Client, services: BotServices) {
  await services.logger.info("discord bot ready", {
    area: "Startup",
    guilds: client.guilds.cache.size,
    commands: commands.length,
  });

  await sendHeartbeat({ client, website: services.website, commandCount: commands.length, status: "Online" });

  setInterval(() => {
    sendHeartbeat({ client, website: services.website, commandCount: commands.length, status: "Online" }).catch((error) => {
      services.logger.warn("heartbeat failed", { area: "Heartbeat", error: error instanceof Error ? error.message : "Unknown error" });
    });
    processSyncQueue(services.website).catch((error) => {
      services.logger.warn("sync queue failed", { area: "SyncQueue", error: error instanceof Error ? error.message : "Unknown error" });
    });
  }, Math.max(15, botEnv.heartbeatIntervalSeconds) * 1000).unref();
}
