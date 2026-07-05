import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types/context";
import { prisma } from "../services/prisma";
import { keyValueFields, mxfEmbed, reply, statusEmbed } from "../utils/embeds";
import { parseJson } from "../utils/json";

export const adminCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder()
      .setName("admin")
      .setDescription("MxF Labs admin health, config, logs, and website sync.")
      .addSubcommand((command) => command.setName("sync").setDescription("Run a website sync."))
      .addSubcommand((command) => command.setName("config").setDescription("Show server setup config."))
      .addSubcommand((command) => command.setName("health").setDescription("Show bot/API health."))
      .addSubcommand((command) => command.setName("logs").setDescription("Show recent bot logs."))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    cooldownSeconds: 8,
    async execute({ interaction, services, client }) {
      if (!interaction.guild) {
        await reply(interaction, { embeds: [statusEmbed("Server Required", "Run admin commands inside the configured server.", "error")] }, { private: true });
        return;
      }

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "sync") {
        const result = await services.website.sync("discord-admin-command");
        await reply(interaction, { embeds: [statusEmbed(result.ok ? "Website Sync Complete" : "Website Sync Queued", result.ok ? "Website sync completed." : result.message, result.ok ? "ok" : "warn")] }, { private: true });
        return;
      }

      if (subcommand === "config") {
        const config = await prisma.botGuildConfig.findUnique({ where: { guildId: interaction.guild.id } });
        const logChannels = parseJson<Record<string, string>>(config?.logChannelIdsJson, {});
        const productRoles = parseJson<Record<string, string>>(config?.productRoleMapJson, {});
        await reply(
          interaction,
          {
            embeds: [
              mxfEmbed({ title: "MxF Labs Server Config", description: "Current bot-managed setup configuration." }).addFields(
                keyValueFields({
                  SetupCompleted: config?.setupCompleted ? "Yes" : "No",
                  SetupMode: config?.setupMode || "Not Configured",
                  WebsiteSync: config?.websiteSyncStatus || "Not Synced",
                  TicketPanel: config?.ticketPanelChannelId || "Missing",
                  ProductRoles: Object.keys(productRoles).length,
                  LogChannels: Object.keys(logChannels).length,
                }),
              ),
            ],
          },
          { private: true },
        );
        return;
      }

      if (subcommand === "health") {
        const heartbeat = await prisma.botHeartbeat.findFirst({ orderBy: { createdAt: "desc" } });
        await reply(
          interaction,
          {
            embeds: [
              statusEmbed("MxF Labs Bot Health", "Current local bot and website status.").addFields(
                keyValueFields({
                  Bot: client.user?.tag || "Logged in",
                  Guilds: client.guilds.cache.size,
                  Latency: `${client.ws.ping}ms`,
                  WebsiteAPI: heartbeat?.websiteApiStatus || "Unknown",
                  LicenseAPI: heartbeat?.licenseApiStatus || "Unknown",
                  LastHeartbeat: heartbeat?.createdAt.toLocaleString() || "Never",
                }),
              ),
            ],
          },
          { private: true },
        );
        return;
      }

      const logs = await prisma.botLog.findMany({ where: { guildId: interaction.guild.id }, orderBy: { createdAt: "desc" }, take: 8 });
      await reply(
        interaction,
        {
          embeds: [
            mxfEmbed({
              title: "MxF Labs Admin Logs",
              description: logs.length ? logs.map((log) => `${log.createdAt.toLocaleString()} / ${log.area} / ${log.action}`).join("\n") : "No bot logs are recorded for this server yet.",
            }),
          ],
        },
        { private: true },
      );
    },
  },
];
