import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { CommandModule } from "../types/context";
import { createModerationCase, warnUser } from "../modules/moderation";
import { reply, statusEmbed } from "../utils/embeds";
import { formatDuration } from "../utils/format";
import { canModerate, requireGuildId } from "../utils/permissions";

type BulkDeleteChannel = { bulkDelete(amount: number, filterOld?: boolean): Promise<unknown> };
type SlowmodeChannel = { setRateLimitPerUser(seconds: number, reason?: string): Promise<unknown> };
type LockableChannel = {
  permissionOverwrites: {
    edit(target: string, permissions: Record<string, boolean | null>, options?: { reason?: string }): Promise<unknown>;
  };
};

function hasBulkDelete(channel: unknown): channel is BulkDeleteChannel {
  return typeof (channel as BulkDeleteChannel | null)?.bulkDelete === "function";
}

function hasSlowmode(channel: unknown): channel is SlowmodeChannel {
  return typeof (channel as SlowmodeChannel | null)?.setRateLimitPerUser === "function";
}

function hasPermissionOverwrites(channel: unknown): channel is LockableChannel {
  return typeof (channel as LockableChannel | null)?.permissionOverwrites?.edit === "function";
}

async function guardMod(interaction: ChatInputCommandInteraction) {
  if (!canModerate(interaction)) {
    await reply(interaction, { embeds: [statusEmbed("Permission Required", "This moderation command requires staff permissions.", "error")] }, { private: true });
    return false;
  }
  return true;
}

export const modCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder()
      .setName("mod")
      .setDescription("Grouped MxF Labs moderation commands.")
      .addSubcommand((command) => command.setName("ban").setDescription("Ban a user.").addUserOption((option) => option.setName("user").setDescription("Target user.").setRequired(true)).addStringOption((option) => option.setName("reason").setDescription("Reason.")))
      .addSubcommand((command) => command.setName("kick").setDescription("Kick a user.").addUserOption((option) => option.setName("user").setDescription("Target user.").setRequired(true)).addStringOption((option) => option.setName("reason").setDescription("Reason.")))
      .addSubcommand((command) => command.setName("timeout").setDescription("Timeout a user.").addUserOption((option) => option.setName("user").setDescription("Target user.").setRequired(true)).addIntegerOption((option) => option.setName("minutes").setDescription("Duration in minutes.").setRequired(true).setMinValue(1).setMaxValue(40320)).addStringOption((option) => option.setName("reason").setDescription("Reason.")))
      .addSubcommand((command) => command.setName("warn").setDescription("Warn a user.").addUserOption((option) => option.setName("user").setDescription("Target user.").setRequired(true)).addStringOption((option) => option.setName("reason").setDescription("Reason.")))
      .addSubcommand((command) => command.setName("clear").setDescription("Clear recent messages.").addIntegerOption((option) => option.setName("amount").setDescription("Amount.").setRequired(true).setMinValue(1).setMaxValue(100)))
      .addSubcommand((command) => command.setName("slowmode").setDescription("Set channel slowmode.").addIntegerOption((option) => option.setName("seconds").setDescription("Slowmode seconds.").setRequired(true).setMinValue(0).setMaxValue(21600)))
      .addSubcommand((command) => command.setName("lock").setDescription("Lock the current channel."))
      .addSubcommand((command) => command.setName("unlock").setDescription("Unlock the current channel."))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    cooldownSeconds: 5,
    async execute({ interaction }) {
      if (!(await guardMod(interaction))) return;
      const guildId = requireGuildId(interaction);
      const subcommand = interaction.options.getSubcommand();
      const reason = interaction.options.getString("reason") || "No reason provided";

      if (subcommand === "ban") {
        const user = interaction.options.getUser("user", true);
        await interaction.guild?.members.ban(user.id, { reason }).catch(() => null);
        const moderationCase = await createModerationCase({ guildId, moderatorId: interaction.user.id, targetId: user.id, action: "Ban", reason, status: "Closed" });
        await reply(interaction, { embeds: [statusEmbed("User Banned", `Created case ${moderationCase.caseNumber}.`)] }, { private: true });
        return;
      }

      if (subcommand === "kick") {
        const user = interaction.options.getUser("user", true);
        const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
        await member?.kick(reason).catch(() => null);
        const moderationCase = await createModerationCase({ guildId, moderatorId: interaction.user.id, targetId: user.id, action: "Kick", reason, status: "Closed" });
        await reply(interaction, { embeds: [statusEmbed("User Kicked", `Created case ${moderationCase.caseNumber}.`)] }, { private: true });
        return;
      }

      if (subcommand === "timeout") {
        const user = interaction.options.getUser("user", true);
        const minutes = interaction.options.getInteger("minutes", true);
        const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
        await member?.timeout(minutes * 60 * 1000, reason).catch(() => null);
        const moderationCase = await createModerationCase({ guildId, moderatorId: interaction.user.id, targetId: user.id, action: "Timeout", reason, durationSeconds: minutes * 60 });
        await reply(interaction, { embeds: [statusEmbed("User Timed Out", `Created case ${moderationCase.caseNumber} for ${formatDuration(minutes * 60)}.`)] }, { private: true });
        return;
      }

      if (subcommand === "warn") {
        const user = interaction.options.getUser("user", true);
        const result = await warnUser({ guildId, moderatorId: interaction.user.id, targetId: user.id, reason });
        await reply(interaction, { embeds: [statusEmbed("User Warned", `Created case ${result.moderationCase.caseNumber}.`)] }, { private: true });
        return;
      }

      if (subcommand === "clear") {
        const amount = interaction.options.getInteger("amount", true);
        if (hasBulkDelete(interaction.channel)) await interaction.channel.bulkDelete(amount, true);
        await createModerationCase({ guildId, moderatorId: interaction.user.id, targetId: interaction.channelId, action: "Clear", reason: `${amount} messages` });
        await reply(interaction, { embeds: [statusEmbed("Messages Cleared", `Attempted to remove ${amount} messages.`)] }, { private: true });
        return;
      }

      if (subcommand === "slowmode") {
        const seconds = interaction.options.getInteger("seconds", true);
        if (hasSlowmode(interaction.channel)) await interaction.channel.setRateLimitPerUser(seconds, "MxF Labs slowmode command");
        await createModerationCase({ guildId, moderatorId: interaction.user.id, targetId: interaction.channelId, action: "Slowmode", reason: `${seconds}s` });
        await reply(interaction, { embeds: [statusEmbed("Slowmode Updated", `This channel slowmode is now ${seconds}s.`)] }, { private: true });
        return;
      }

      if (hasPermissionOverwrites(interaction.channel) && interaction.guild) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { SendMessages: subcommand === "lock" ? false : null }, { reason: `MxF Labs ${subcommand} command` });
      }
      await createModerationCase({ guildId, moderatorId: interaction.user.id, targetId: interaction.channelId, action: subcommand === "lock" ? "Lock" : "Unlock", reason: `Channel ${subcommand}` });
      await reply(interaction, { embeds: [statusEmbed(subcommand === "lock" ? "Channel Locked" : "Channel Unlocked", subcommand === "lock" ? "Send message permission was disabled for everyone." : "Send message permission was reset for everyone.")] }, { private: true });
    },
  },
];
