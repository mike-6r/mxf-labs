import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types/context";
import { riskServer, riskUser } from "../modules/intelligence";
import { prisma } from "../services/prisma";
import { keyValueFields, mxfEmbed, reply, statusEmbed } from "../utils/embeds";
import { canManageGuild, requireGuildId } from "../utils/permissions";

export const intelligenceCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder().setName("serverinfo").setDescription("Show Discord server information."),
    cooldownSeconds: 8,
    async execute({ interaction }) {
      const guild = interaction.guild;
      if (!guild) {
        await reply(interaction, { embeds: [statusEmbed("Server Required", "Run this inside a server.", "warn")] }, { private: true });
        return;
      }
      await reply(interaction, {
        embeds: [
          mxfEmbed({ title: guild.name, description: "Discord-visible server profile." }).addFields(
            keyValueFields({
              ID: guild.id,
              Members: guild.memberCount,
              Owner: `<@${guild.ownerId}>`,
              Created: guild.createdAt.toLocaleDateString(),
              BoostTier: guild.premiumTier,
            }),
          ),
        ],
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("userinfo")
      .setDescription("Show Discord-visible user information.")
      .addUserOption((option) => option.setName("user").setDescription("User to inspect.")),
    cooldownSeconds: 8,
    async execute({ interaction }) {
      const user = interaction.options.getUser("user") || interaction.user;
      const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
      await reply(interaction, {
        embeds: [
          mxfEmbed({ title: user.tag, description: "Discord-visible account profile." }).addFields(
            keyValueFields({
              ID: user.id,
              Created: user.createdAt.toLocaleDateString(),
              Joined: member?.joinedAt?.toLocaleDateString() || "Not in server",
              Bot: user.bot ? "Yes" : "No",
              Roles: member ? member.roles.cache.filter((role) => role.id !== interaction.guildId).size : "N/A",
            }),
          ),
        ],
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("roleinfo")
      .setDescription("Show role information.")
      .addRoleOption((option) => option.setName("role").setDescription("Role to inspect.").setRequired(true)),
    cooldownSeconds: 8,
    async execute({ interaction }) {
      const role = interaction.options.getRole("role", true);
      await reply(interaction, {
        embeds: [
          mxfEmbed({ title: role.name, description: "Role profile." }).addFields(
            keyValueFields({
              ID: role.id,
              Mentionable: role.mentionable ? "Yes" : "No",
              Managed: role.managed ? "Yes" : "No",
              Position: role.position,
              Members: "members" in role ? role.members.size : "N/A",
            }),
          ),
        ],
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("channelinfo")
      .setDescription("Show channel information.")
      .addChannelOption((option) => option.setName("channel").setDescription("Channel to inspect.")),
    cooldownSeconds: 8,
    async execute({ interaction }) {
      const channel = interaction.options.getChannel("channel") || interaction.channel;
      const createdAt = channel && "createdAt" in channel && channel.createdAt instanceof Date ? channel.createdAt : null;
      await reply(interaction, {
        embeds: [
          mxfEmbed({ title: channel?.toString() || "Unknown Channel", description: "Channel profile." }).addFields(
            keyValueFields({
              ID: channel?.id,
              Type: channel?.type,
              Created: createdAt?.toLocaleDateString(),
            }),
          ),
        ],
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("avatar")
      .setDescription("Show a user avatar.")
      .addUserOption((option) => option.setName("user").setDescription("User.")),
    cooldownSeconds: 8,
    async execute({ interaction }) {
      const user = interaction.options.getUser("user") || interaction.user;
      await reply(interaction, { embeds: [mxfEmbed({ title: `${user.tag} Avatar`, description: user.displayAvatarURL({ size: 1024 }) }).setImage(user.displayAvatarURL({ size: 1024 }))] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("banner")
      .setDescription("Show a user banner if available.")
      .addUserOption((option) => option.setName("user").setDescription("User.")),
    cooldownSeconds: 8,
    async execute({ interaction }) {
      const user = await interaction.client.users.fetch((interaction.options.getUser("user") || interaction.user).id, { force: true });
      const banner = user.bannerURL({ size: 1024 });
      await reply(interaction, { embeds: [banner ? mxfEmbed({ title: `${user.tag} Banner`, description: banner }).setImage(banner) : statusEmbed("No Banner", "No public banner is available.", "warn")] }, { private: !banner });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("inviteinfo")
      .setDescription("Inspect an invite code.")
      .addStringOption((option) => option.setName("code").setDescription("Invite code or URL.").setRequired(true)),
    cooldownSeconds: 10,
    async execute({ interaction }) {
      const code = interaction.options.getString("code", true).split("/").pop() || "";
      const invite = await interaction.client.fetchInvite(code).catch(() => null);
      await reply(interaction, {
        embeds: [
          invite
            ? mxfEmbed({ title: "Invite Info", description: invite.url }).addFields(
                keyValueFields({
                  Guild: invite.guild?.name,
                  Channel: invite.channel?.toString(),
                  Uses: invite.uses ?? "Unknown",
                }),
              )
            : statusEmbed("Invite Not Found", "Discord did not return invite data.", "warn"),
        ],
      }, { private: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("membercount").setDescription("Show current member count."),
    cooldownSeconds: 8,
    async execute({ interaction }) {
      await reply(interaction, { embeds: [statusEmbed("Member Count", `${interaction.guild?.memberCount || 0} members.`)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("joinhistory").setDescription("Show recent join signals."),
    cooldownSeconds: 8,
    async execute({ interaction }) {
      const members = await interaction.guild?.members.fetch({ limit: 10 }).catch(() => null);
      const recent = members ? [...members.values()].sort((a, b) => (b.joinedTimestamp || 0) - (a.joinedTimestamp || 0)).slice(0, 8) : [];
      await reply(interaction, { embeds: [mxfEmbed({ title: "Recent Joins", description: recent.length ? recent.map((member) => `${member.user.tag} / ${member.joinedAt?.toLocaleDateString() || "Unknown"}`).join("\n") : "No cached joins." })] }, { private: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("audit").setDescription("Show recent bot audit logs.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    cooldownSeconds: 8,
    async execute({ interaction }) {
      if (!canManageGuild(interaction)) {
        await reply(interaction, { embeds: [statusEmbed("Permission Required", "Audit requires Manage Server.", "error")] }, { private: true });
        return;
      }
      const logs = await prisma.botLog.findMany({ where: { guildId: interaction.guildId || undefined }, orderBy: { createdAt: "desc" }, take: 10 });
      await reply(interaction, { embeds: [mxfEmbed({ title: "Audit", description: logs.length ? logs.map((log) => `${log.area} / ${log.action}`).join("\n") : "No bot logs yet." })] }, { private: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("activity").setDescription("Show recent platform activity.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    cooldownSeconds: 8,
    async execute({ interaction }) {
      const events = await prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 });
      await reply(interaction, { embeds: [mxfEmbed({ title: "Platform Activity", description: events.length ? events.map((event) => `${event.action} / ${event.entityType}`).join("\n") : "No activity yet." })] }, { private: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("risk")
      .setDescription("Risk scoring based on Discord-visible and platform-linked signals.")
      .addSubcommand((command) =>
        command
          .setName("user")
          .setDescription("Score a user.")
          .addUserOption((option) => option.setName("user").setDescription("User to score.").setRequired(true)),
      )
      .addSubcommand((command) => command.setName("server").setDescription("Score this server."))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    cooldownSeconds: 10,
    async execute({ interaction }) {
      if (!canManageGuild(interaction)) {
        await reply(interaction, { embeds: [statusEmbed("Permission Required", "Risk scoring requires Manage Server.", "error")] }, { private: true });
        return;
      }
      const guildId = requireGuildId(interaction);
      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "server" && interaction.guild) {
        const risk = await riskServer(interaction.guild);
        await reply(interaction, { embeds: [mxfEmbed({ title: "Server Risk", description: `${risk.level} risk score.` }).addFields(keyValueFields(risk))] }, { private: true });
        return;
      }
      const user = interaction.options.getUser("user", true);
      const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
      const risk = await riskUser({ guildId, user, member });
      await reply(interaction, { embeds: [mxfEmbed({ title: "User Risk", description: `${risk.level} risk score for ${user.tag}.` }).addFields(keyValueFields(risk))] }, { private: true });
    },
  },
];
