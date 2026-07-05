import { PermissionFlagsBits, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import { botEnv } from "../config/env";

export function isBotOwner(userId: string) {
  return botEnv.ownerIds.includes(userId);
}

export function isAdminInteraction(interaction: ChatInputCommandInteraction) {
  return Boolean(interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) || isBotOwner(interaction.user.id));
}

export function canManageGuild(interaction: ChatInputCommandInteraction) {
  return Boolean(interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) || isAdminInteraction(interaction));
}

export function canModerate(interaction: ChatInputCommandInteraction) {
  return Boolean(
    interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers) ||
      interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers) ||
      interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers) ||
      isAdminInteraction(interaction),
  );
}

export function canManageTickets(interaction: ChatInputCommandInteraction) {
  return Boolean(
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) ||
      interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) ||
      canManageGuild(interaction),
  );
}

export function isHierarchySafe(actor: GuildMember | null, target: GuildMember | null) {
  if (!actor || !target) return true;
  if (actor.id === target.id) return false;
  if (actor.guild.ownerId === actor.id) return true;
  return actor.roles.highest.comparePositionTo(target.roles.highest) > 0;
}

export function requireGuildId(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    throw new Error("This command must be used inside a Discord server.");
  }
  return interaction.guildId;
}
