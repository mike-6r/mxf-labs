import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types/context";
import { prisma } from "../services/prisma";
import { keyValueFields, mxfEmbed, reply, statusEmbed } from "../utils/embeds";
import { canManageGuild, requireGuildId } from "../utils/permissions";

export const utilityCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder().setName("ping").setDescription("Check bot latency."),
    cooldownSeconds: 5,
    async execute({ interaction, client }) {
      await reply(interaction, { embeds: [statusEmbed("Pong", `Websocket latency: ${Math.round(client.ws.ping)}ms.`)] }, { private: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("help").setDescription("Show MxF Labs bot command areas."),
    cooldownSeconds: 10,
    async execute({ interaction }) {
      await reply(interaction, {
        embeds: [
          mxfEmbed({
            title: "MxF Labs Discord OS",
            description:
              "Core areas: account linking, license checks, product role sync, tickets, moderation, AutoMod, giveaways, suggestions, setup, and server intelligence.",
          }).addFields(
            keyValueFields({
              Account: "/link, /products owned",
              Licensing: "/license check, /license activate, /license status",
              Staff: "/setup, /config, /sync, /ticket, /giveaway, /suggestion",
              Moderation: "/ban, /kick, /timeout, /warn, /purge, /modlogs",
            }),
          ),
        ],
      }, { private: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("status").setDescription("Check website/API sync status."),
    cooldownSeconds: 10,
    async execute({ interaction, services }) {
      const result = await services.website.sync("status-command");
      await reply(interaction, { embeds: [statusEmbed(result.ok ? "Platform Online" : "Platform Degraded", result.ok ? `Website synced at ${result.data.syncedAt}.` : result.message, result.ok ? "ok" : "warn")] }, { private: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("report")
      .setDescription("Report a user or issue to staff.")
      .addStringOption((option) => option.setName("reason").setDescription("Report reason.").setRequired(true))
      .addUserOption((option) => option.setName("user").setDescription("User to report.")),
    cooldownSeconds: 30,
    async execute({ interaction }) {
      const guildId = requireGuildId(interaction);
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason", true);
      await prisma.botLog.create({
        data: {
          guildId,
          actorId: interaction.user.id,
          targetId: user?.id,
          area: "Reports",
          action: "user report submitted",
          severity: "Warning",
          metadataJson: JSON.stringify({ reason }),
        },
      });
      await reply(interaction, { embeds: [statusEmbed("Report Submitted", "Staff will review the report.")] }, { private: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("remind")
      .setDescription("Create a local in-memory reminder.")
      .addIntegerOption((option) => option.setName("minutes").setDescription("Minutes from now.").setRequired(true).setMinValue(1).setMaxValue(10080))
      .addStringOption((option) => option.setName("message").setDescription("Reminder text.").setRequired(true)),
    cooldownSeconds: 10,
    async execute({ interaction }) {
      const minutes = interaction.options.getInteger("minutes", true);
      const message = interaction.options.getString("message", true);
      setTimeout(() => {
        interaction.user.send(`MxF Labs reminder: ${message}`).catch(() => null);
      }, minutes * 60 * 1000);
      await reply(interaction, { embeds: [statusEmbed("Reminder Set", `I will DM you in ${minutes} minute(s).`)] }, { private: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("poll")
      .setDescription("Create a simple poll.")
      .addStringOption((option) => option.setName("question").setDescription("Poll question.").setRequired(true))
      .addStringOption((option) => option.setName("options").setDescription("Comma-separated options.").setRequired(true)),
    cooldownSeconds: 15,
    async execute({ interaction }) {
      const question = interaction.options.getString("question", true);
      const options = interaction.options.getString("options", true).split(",").map((item) => item.trim()).filter(Boolean).slice(0, 8);
      await reply(interaction, { embeds: [mxfEmbed({ title: question, description: options.map((option, index) => `${index + 1}. ${option}`).join("\n") || "No options provided." })] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("embed")
      .setDescription("Post a clean MxF Labs embed.")
      .addStringOption((option) => option.setName("title").setDescription("Embed title.").setRequired(true))
      .addStringOption((option) => option.setName("body").setDescription("Embed body.").setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    cooldownSeconds: 10,
    async execute({ interaction }) {
      if (!canManageGuild(interaction)) {
        await reply(interaction, { embeds: [statusEmbed("Permission Required", "Embed posting requires staff permissions.", "error")] }, { private: true });
        return;
      }
      await reply(interaction, { embeds: [mxfEmbed({ title: interaction.options.getString("title", true), description: interaction.options.getString("body", true) })] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("say")
      .setDescription("Post a plain staff message.")
      .addStringOption((option) => option.setName("message").setDescription("Message.").setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    cooldownSeconds: 10,
    async execute({ interaction }) {
      if (!canManageGuild(interaction)) {
        await reply(interaction, { embeds: [statusEmbed("Permission Required", "Say requires staff permissions.", "error")] }, { private: true });
        return;
      }
      await reply(interaction, { content: interaction.options.getString("message", true) });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("announce")
      .setDescription("Post an announcement embed.")
      .addStringOption((option) => option.setName("title").setDescription("Announcement title.").setRequired(true))
      .addStringOption((option) => option.setName("body").setDescription("Announcement body.").setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    cooldownSeconds: 20,
    async execute({ interaction }) {
      if (!canManageGuild(interaction)) {
        await reply(interaction, { embeds: [statusEmbed("Permission Required", "Announcements require staff permissions.", "error")] }, { private: true });
        return;
      }
      await reply(interaction, { embeds: [mxfEmbed({ title: interaction.options.getString("title", true), description: interaction.options.getString("body", true) })] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("timestamp")
      .setDescription("Convert a date string into a Discord timestamp.")
      .addStringOption((option) => option.setName("date").setDescription("Date string, for example 2026-06-25 15:00.").setRequired(true)),
    cooldownSeconds: 5,
    async execute({ interaction }) {
      const date = new Date(interaction.options.getString("date", true));
      if (Number.isNaN(date.getTime())) {
        await reply(interaction, { embeds: [statusEmbed("Invalid Date", "Discord could not parse that date.", "warn")] }, { private: true });
        return;
      }
      const unix = Math.floor(date.getTime() / 1000);
      await reply(interaction, { content: `<t:${unix}:F> / <t:${unix}:R>` }, { private: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("shortlink").setDescription("Placeholder for future MxF short links.").addStringOption((option) => option.setName("url").setDescription("URL to shorten.").setRequired(true)),
    cooldownSeconds: 8,
    async execute({ interaction }) {
      await reply(interaction, { embeds: [statusEmbed("Shortlink Placeholder", "Shortlink generation will connect to the website API later.")] }, { private: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("qrcode").setDescription("Placeholder for future QR generation.").addStringOption((option) => option.setName("text").setDescription("Text or URL.").setRequired(true)),
    cooldownSeconds: 8,
    async execute({ interaction }) {
      await reply(interaction, { embeds: [statusEmbed("QR Placeholder", "QR generation will connect to a website utility route later.")] }, { private: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("uptime").setDescription("Show bot uptime."),
    cooldownSeconds: 5,
    async execute({ interaction, services }) {
      const seconds = Math.floor((Date.now() - services.startedAt.getTime()) / 1000);
      await reply(interaction, { embeds: [statusEmbed("Uptime", `${seconds} seconds since startup.`)] }, { private: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("botinfo").setDescription("Show bot diagnostics."),
    cooldownSeconds: 8,
    async execute({ interaction, client, services }) {
      const [guildConfigs, logs, queues] = await Promise.all([
        prisma.botGuildConfig.count(),
        prisma.botLog.count(),
        prisma.botSyncQueue.count({ where: { status: "Queued" } }),
      ]);
      await reply(interaction, {
        embeds: [
          mxfEmbed({ title: "Bot Info", description: "MxF Labs Discord companion runtime." }).addFields(
            keyValueFields({
              Guilds: client.guilds.cache.size,
              Commands: "registered",
              Configs: guildConfigs,
              Logs: logs,
              QueuedSync: queues,
              Started: services.startedAt.toLocaleString(),
            }),
          ),
        ],
      }, { private: true });
    },
  },
];
