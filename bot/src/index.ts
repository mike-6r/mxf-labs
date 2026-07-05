import {
  Client,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { commands } from "./commands";
import { botEnv, requireBotRuntimeConfig, runtimeConfigStatus } from "./config/env";
import { onGuildMemberAdd } from "./events/guild-member-add";
import { onInteractionCreate } from "./events/interaction-create";
import { onMessageCreate } from "./events/message-create";
import { onReady } from "./events/ready";
import { sendHeartbeat } from "./services/heartbeat";
import { prisma } from "./services/prisma";
import { createServices } from "./services/container";
import { registerCommands } from "./register-commands";

const startedAt = new Date();
const services = createServices(startedAt);

async function main() {
  requireBotRuntimeConfig({ allowLocal: botEnv.localMode });

  if (!botEnv.token && botEnv.localMode) {
    await services.logger.info("discord bot local dry run", {
      area: "Startup",
      commands: commands.length,
      config: runtimeConfigStatus(),
    });
    await prisma.botHeartbeat.create({
      data: {
        botId: "mxf-labs-bot",
        status: "Local Dry Run",
        guildCount: 0,
        commandCount: commands.length,
        latencyMs: 0,
        websiteApiStatus: botEnv.apiBaseUrl ? "Configured" : "Missing",
        licenseApiStatus: "Configured",
        version: "0.1.0",
        metadataJson: JSON.stringify({ mode: "local", commandNames: commands.map((command) => command.data.name) }),
      },
    });
    console.log(`[MxF Bot] Local dry run complete. Commands loaded: ${commands.length}.`);
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.User],
  });

  client.once("clientReady", async () => {
    if (botEnv.registerCommandsOnStart) {
      await registerCommands().catch((error) => {
        services.logger.warn("command registration on start failed", {
          area: "Startup",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
    }
    await onReady(client, services);
  });

  client.on("interactionCreate", (interaction) => {
    onInteractionCreate(interaction, client, services).catch((error) => {
      services.logger.error("interaction handler failed", {
        area: "Interactions",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    });
  });

  client.on("messageCreate", (message) => {
    onMessageCreate(message, services).catch((error) => {
      services.logger.warn("message handler failed", {
        area: "Messages",
        guildId: message.guildId,
        actorId: message.author.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    });
  });

  client.on("guildMemberAdd", (member) => {
    onGuildMemberAdd(member, services).catch(() => null);
  });

  process.on("SIGINT", async () => {
    await sendHeartbeat({ client, website: services.website, commandCount: commands.length, status: "Stopping" }).catch(() => null);
    client.destroy();
    await prisma.$disconnect();
    process.exit(0);
  });

  await client.login(botEnv.token);
}

main().catch(async (error) => {
  await services.logger.error("discord bot crashed during startup", {
    area: "Startup",
    error: error instanceof Error ? error.message : "Unknown error",
  });
  await prisma.$disconnect();
  process.exit(1);
});
