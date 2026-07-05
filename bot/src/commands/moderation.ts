import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { CommandModule } from "../types/context";
import { createModerationCase, getCases, getWarnings, removeLatestWarning, warnUser } from "../modules/moderation";
import { keyValueFields, mxfEmbed, reply, statusEmbed } from "../utils/embeds";
import { canModerate, requireGuildId } from "../utils/permissions";
import { formatDuration } from "../utils/format";

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

async function guardModeration(interaction: ChatInputCommandInteraction) {
  if (!canModerate(interaction)) {
    await reply(interaction, { embeds: [statusEmbed("Permission Required", "This moderation command requires staff permissions.", "error")] }, { private: true });
    return false;
  }
  return true;
}

function moderationCommand(name: string, description: string, execute: CommandModule["execute"], options?: { duration?: boolean; amount?: boolean; channel?: boolean }) {
  const builder = new SlashCommandBuilder().setName(name).setDescription(description).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

  if (["ban", "kick", "timeout", "warn", "unwarn", "nickname"].includes(name)) {
    builder.addUserOption((option) => option.setName("user").setDescription("Target user.").setRequired(true));
  }

  if (options?.duration) {
    builder.addIntegerOption((option) => option.setName("minutes").setDescription("Duration in minutes.").setRequired(true).setMinValue(1).setMaxValue(40320));
  }

  if (options?.amount) {
    builder.addIntegerOption((option) => option.setName("amount").setDescription("Amount.").setRequired(true).setMinValue(1).setMaxValue(100));
  }

  if (name === "nickname") {
    builder.addStringOption((option) => option.setName("nickname").setDescription("New nickname. Leave blank to reset."));
  } else if (!["warnings", "modlogs", "case", "cases", "purge", "slowmode", "lock", "unlock"].includes(name)) {
    builder.addStringOption((option) => option.setName("reason").setDescription("Reason."));
  }

  if (["warnings", "case", "cases"].includes(name)) {
    if (name === "case") {
      builder.addStringOption((option) => option.setName("id").setDescription("Case number.").setRequired(true));
    } else {
      builder.addUserOption((option) => option.setName("user").setDescription("Filter by user."));
    }
  }

  if (name === "slowmode") {
    builder.addIntegerOption((option) => option.setName("seconds").setDescription("Slowmode seconds.").setRequired(true).setMinValue(0).setMaxValue(21600));
  }

  return { data: builder, cooldownSeconds: 5, execute } satisfies CommandModule;
}

export const moderationCommands: CommandModule[] = [
  moderationCommand("ban", "Ban a user and create a moderation case.", async ({ interaction }) => {
    if (!(await guardModeration(interaction))) return;
    const guildId = requireGuildId(interaction);
    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") || "No reason provided";
    await interaction.guild?.members.ban(user.id, { reason }).catch(() => null);
    const moderationCase = await createModerationCase({ guildId, moderatorId: interaction.user.id, targetId: user.id, action: "Ban", reason, status: "Closed" });
    await reply(interaction, { embeds: [statusEmbed("User Banned", `Created case ${moderationCase.caseNumber}.`)] }, { private: true });
  }),
  moderationCommand("kick", "Kick a user and create a moderation case.", async ({ interaction }) => {
    if (!(await guardModeration(interaction))) return;
    const guildId = requireGuildId(interaction);
    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") || "No reason provided";
    const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
    await member?.kick(reason).catch(() => null);
    const moderationCase = await createModerationCase({ guildId, moderatorId: interaction.user.id, targetId: user.id, action: "Kick", reason, status: "Closed" });
    await reply(interaction, { embeds: [statusEmbed("User Kicked", `Created case ${moderationCase.caseNumber}.`)] }, { private: true });
  }),
  moderationCommand(
    "timeout",
    "Timeout a user and create a moderation case.",
    async ({ interaction }) => {
      if (!(await guardModeration(interaction))) return;
      const guildId = requireGuildId(interaction);
      const user = interaction.options.getUser("user", true);
      const minutes = interaction.options.getInteger("minutes", true);
      const reason = interaction.options.getString("reason") || "No reason provided";
      const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
      await member?.timeout(minutes * 60 * 1000, reason).catch(() => null);
      const moderationCase = await createModerationCase({
        guildId,
        moderatorId: interaction.user.id,
        targetId: user.id,
        action: "Timeout",
        reason,
        durationSeconds: minutes * 60,
      });
      await reply(interaction, { embeds: [statusEmbed("User Timed Out", `Created case ${moderationCase.caseNumber} for ${formatDuration(minutes * 60)}.`)] }, { private: true });
    },
    { duration: true },
  ),
  moderationCommand("warn", "Warn a user and create a warning record.", async ({ interaction }) => {
    if (!(await guardModeration(interaction))) return;
    const guildId = requireGuildId(interaction);
    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") || "No reason provided";
    const result = await warnUser({ guildId, moderatorId: interaction.user.id, targetId: user.id, reason });
    await reply(interaction, { embeds: [statusEmbed("User Warned", `Created case ${result.moderationCase.caseNumber}.`)] }, { private: true });
  }),
  moderationCommand("unwarn", "Remove the latest active warning from a user.", async ({ interaction }) => {
    if (!(await guardModeration(interaction))) return;
    const guildId = requireGuildId(interaction);
    const user = interaction.options.getUser("user", true);
    const result = await removeLatestWarning({ guildId, moderatorId: interaction.user.id, targetId: user.id, reason: "Manual unwarn" });
    await reply(interaction, { embeds: [statusEmbed(result ? "Warning Removed" : "No Active Warning", result ? `Created case ${result.moderationCase.caseNumber}.` : "No active warning was found.", result ? "ok" : "warn")] }, { private: true });
  }),
  moderationCommand("warnings", "List active warnings for a user.", async ({ interaction }) => {
    const guildId = requireGuildId(interaction);
    const user = interaction.options.getUser("user") || interaction.user;
    const warnings = await getWarnings(guildId, user.id);
    await reply(
      interaction,
      {
        embeds: [
          mxfEmbed({
            title: "Warnings",
            description: warnings.length ? warnings.map((warning) => `${warning.createdAt.toLocaleDateString()} / ${warning.reason}`).join("\n") : "No active warnings.",
          }).addFields(keyValueFields({ User: user.tag, Count: warnings.length })),
        ],
      },
      { private: true },
    );
  }),
  moderationCommand(
    "purge",
    "Bulk delete recent messages.",
    async ({ interaction }) => {
      if (!(await guardModeration(interaction))) return;
      const amount = interaction.options.getInteger("amount", true);
      if (hasBulkDelete(interaction.channel)) {
        await interaction.channel.bulkDelete(amount, true);
      }
      await createModerationCase({ guildId: requireGuildId(interaction), moderatorId: interaction.user.id, targetId: interaction.channelId, action: "Purge", reason: `${amount} messages` });
      await reply(interaction, { embeds: [statusEmbed("Messages Purged", `Attempted to remove ${amount} messages.`)] }, { private: true });
    },
    { amount: true },
  ),
  moderationCommand("slowmode", "Set channel slowmode.", async ({ interaction }) => {
    if (!(await guardModeration(interaction))) return;
    const seconds = interaction.options.getInteger("seconds", true);
    if (hasSlowmode(interaction.channel)) {
      await interaction.channel.setRateLimitPerUser(seconds, "MxF Labs slowmode command");
    }
    await createModerationCase({ guildId: requireGuildId(interaction), moderatorId: interaction.user.id, targetId: interaction.channelId, action: "Slowmode", reason: `${seconds}s` });
    await reply(interaction, { embeds: [statusEmbed("Slowmode Updated", `This channel slowmode is now ${seconds}s.`)] }, { private: true });
  }),
  moderationCommand("lock", "Lock the current channel.", async ({ interaction }) => {
    if (!(await guardModeration(interaction))) return;
    if (hasPermissionOverwrites(interaction.channel) && interaction.guild) {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { SendMessages: false }, { reason: "MxF Labs lock command" });
    }
    await createModerationCase({ guildId: requireGuildId(interaction), moderatorId: interaction.user.id, targetId: interaction.channelId, action: "Lock", reason: "Channel locked" });
    await reply(interaction, { embeds: [statusEmbed("Channel Locked", "Send message permission was disabled for everyone.")] }, { private: true });
  }),
  moderationCommand("unlock", "Unlock the current channel.", async ({ interaction }) => {
    if (!(await guardModeration(interaction))) return;
    if (hasPermissionOverwrites(interaction.channel) && interaction.guild) {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { SendMessages: null }, { reason: "MxF Labs unlock command" });
    }
    await createModerationCase({ guildId: requireGuildId(interaction), moderatorId: interaction.user.id, targetId: interaction.channelId, action: "Unlock", reason: "Channel unlocked" });
    await reply(interaction, { embeds: [statusEmbed("Channel Unlocked", "Send message permission was reset for everyone.")] }, { private: true });
  }),
  moderationCommand("nickname", "Set or reset a member nickname.", async ({ interaction }) => {
    if (!(await guardModeration(interaction))) return;
    const user = interaction.options.getUser("user", true);
    const nickname = interaction.options.getString("nickname");
    const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
    await member?.setNickname(nickname, "MxF Labs nickname command").catch(() => null);
    const moderationCase = await createModerationCase({
      guildId: requireGuildId(interaction),
      moderatorId: interaction.user.id,
      targetId: user.id,
      action: "Nickname",
      reason: nickname ? `Set to ${nickname}` : "Reset nickname",
      status: "Closed",
    });
    await reply(interaction, { embeds: [statusEmbed("Nickname Updated", `Created case ${moderationCase.caseNumber}.`)] }, { private: true });
  }),
  moderationCommand("modlogs", "Show recent moderation cases.", async ({ interaction }) => {
    const cases = await getCases(requireGuildId(interaction));
    await reply(interaction, { embeds: [mxfEmbed({ title: "Recent Mod Logs", description: cases.length ? cases.map((item) => `${item.caseNumber} / ${item.action} / <@${item.targetId}>`).join("\n") : "No cases yet." })] }, { private: true });
  }),
  moderationCommand("case", "Show one moderation case.", async ({ interaction }) => {
    const caseNumber = interaction.options.getString("id", true);
    const moderationCase = (await getCases(requireGuildId(interaction))).find((item) => item.caseNumber === caseNumber);
    await reply(interaction, { embeds: [moderationCase ? mxfEmbed({ title: moderationCase.caseNumber, description: moderationCase.reason }).addFields(keyValueFields({ Action: moderationCase.action, Target: `<@${moderationCase.targetId}>`, Moderator: `<@${moderationCase.moderatorId}>`, Status: moderationCase.status })) : statusEmbed("Case Not Found", "No matching case was found.", "warn")] }, { private: true });
  }),
  moderationCommand("cases", "Show moderation cases for a user.", async ({ interaction }) => {
    const user = interaction.options.getUser("user");
    const cases = await getCases(requireGuildId(interaction), user?.id);
    await reply(interaction, { embeds: [mxfEmbed({ title: "Cases", description: cases.length ? cases.map((item) => `${item.caseNumber} / ${item.action} / <@${item.targetId}>`).join("\n") : "No cases found." })] }, { private: true });
  }),
];
