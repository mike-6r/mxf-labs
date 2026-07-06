import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  type CategoryChannel,
  type Guild,
  type GuildBasedChannel,
  type GuildChannelCreateOptions,
  type GuildMember,
  type OverwriteResolvable,
  type Role,
  type TextChannel,
} from "discord.js";
import { ticketPanelComponents, mxfEmbed } from "../utils/embeds";
import { productPanelButtons, productPanelEmbed, productPanels } from "../config/product-panels";
import { parseJson, toJson } from "../utils/json";
import { prisma } from "../services/prisma";
import type { SetupContentResponse, WebsiteApiClient } from "../services/website-api";
import { buildRoleSyncPlan } from "./role-sync";
import { queueWebsiteEvent } from "../services/sync-queue";

export type SetupMode = "basic" | "standard" | "full" | "custom";

type SetupRole = {
  key: string;
  name: string;
  color: number;
  group: "staff" | "customer" | "product" | "utility";
  modes: SetupMode[];
  productSlug?: string;
};

type SetupChannel = {
  key: string;
  name: string;
  displayName?: string;
  category: string;
  kind: "public" | "announcement" | "product" | "support" | "customer" | "staff" | "log";
  modes: SetupMode[];
  productSlug?: string;
  logKey?: string;
};

type SetupCategory = {
  key: string;
  name: string;
  kind: "public" | "support" | "product" | "customer" | "staff" | "log";
  modes: SetupMode[];
};

type SetupComponentRow = ActionRowBuilder<ButtonBuilder> | ActionRowBuilder<StringSelectMenuBuilder>;

type SetupEmbedVisual = {
  image?: string;
  thumbnail?: string;
  color?: number;
  footer?: string;
};

export type SetupRepairTarget = "all" | "roles" | "channels";
export type SetupResetOption = "config" | "channels" | "roles" | "panels" | "full";

export const REQUIRED_SETUP_PERMISSIONS = [
  { label: "Manage Roles", flag: PermissionFlagsBits.ManageRoles },
  { label: "Manage Channels", flag: PermissionFlagsBits.ManageChannels },
  { label: "Manage Messages", flag: PermissionFlagsBits.ManageMessages },
  { label: "View Audit Log", flag: PermissionFlagsBits.ViewAuditLog },
  { label: "Send Messages", flag: PermissionFlagsBits.SendMessages },
  { label: "Embed Links", flag: PermissionFlagsBits.EmbedLinks },
  { label: "Attach Files", flag: PermissionFlagsBits.AttachFiles },
  { label: "Use Slash Commands", flag: PermissionFlagsBits.UseApplicationCommands },
  { label: "Manage Webhooks", flag: PermissionFlagsBits.ManageWebhooks },
  { label: "Read Message History", flag: PermissionFlagsBits.ReadMessageHistory },
  { label: "Moderate Members", flag: PermissionFlagsBits.ModerateMembers },
];

const BASIC: SetupMode[] = ["basic", "standard", "full", "custom"];
const STANDARD: SetupMode[] = ["standard", "full", "custom"];
const FULL: SetupMode[] = ["full", "custom"];

export const SETUP_ROLES: SetupRole[] = [
  { key: "owner", name: "MxF Owner", color: 0x30f7c7, group: "staff", modes: STANDARD },
  { key: "admin", name: "MxF Admin", color: 0x2dd4bf, group: "staff", modes: BASIC },
  { key: "developer", name: "MxF Developer", color: 0x38bdf8, group: "staff", modes: STANDARD },
  { key: "support", name: "MxF Support", color: 0x22c55e, group: "staff", modes: BASIC },
  { key: "moderator", name: "MxF Moderator", color: 0x818cf8, group: "staff", modes: STANDARD },
  { key: "customer", name: "MxF Customer", color: 0x14b8a6, group: "customer", modes: BASIC },
  { key: "verifiedCustomer", name: "Verified Customer", color: 0x5eead4, group: "customer", modes: BASIC },
  { key: "premiumSupport", name: "Premium Support", color: 0xfacc15, group: "customer", modes: STANDARD },
  { key: "betaTester", name: "Beta Tester", color: 0xa78bfa, group: "customer", modes: FULL },
  { key: "mxfFactions", name: "MxF Factions Owner", color: 0xf59e0b, group: "product", productSlug: "mxf-factions", modes: STANDARD },
  { key: "mxfPrisons", name: "MxF Prisons Waitlist", color: 0xf472b6, group: "product", productSlug: "mxf-prisons", modes: STANDARD },
  { key: "mxfSkyblock", name: "MxF Skyblock Waitlist", color: 0x34d399, group: "product", productSlug: "mxf-skyblock", modes: STANDARD },
  { key: "mxfAioBot", name: "MxF AIO Bot User", color: 0x60a5fa, group: "product", productSlug: "mxf-aio-bot", modes: STANDARD },
  { key: "giveawayAccess", name: "Giveaway Access", color: 0xf59e0b, group: "utility", modes: FULL },
  { key: "announcementPing", name: "Announcement Ping", color: 0xeab308, group: "utility", modes: FULL },
  { key: "updatePing", name: "Update Ping", color: 0x06b6d4, group: "utility", modes: FULL },
];

export const SETUP_CATEGORIES: SetupCategory[] = [
  { key: "information", name: "MXF INFORMATION", kind: "public", modes: BASIC },
  { key: "support", name: "MXF SUPPORT", kind: "support", modes: BASIC },
  { key: "tickets", name: "🎫 MXF TICKETS", kind: "support", modes: BASIC },
  { key: "products", name: "MXF PRODUCTS", kind: "product", modes: STANDARD },
  { key: "community", name: "MXF COMMUNITY", kind: "public", modes: STANDARD },
  { key: "staff", name: "MXF STAFF", kind: "staff", modes: STANDARD },
  { key: "logs", name: "MXF LOGS", kind: "log", modes: STANDARD },
];

export const SETUP_CHANNELS: SetupChannel[] = [
  { key: "welcome", name: "welcome", displayName: "📌・welcome", category: "information", kind: "public", modes: BASIC },
  { key: "announcements", name: "announcements", displayName: "📣・announcements", category: "information", kind: "announcement", modes: BASIC },
  { key: "productUpdates", name: "product-updates", displayName: "🧪・product-updates", category: "information", kind: "announcement", modes: STANDARD },
  { key: "changelog", name: "changelog", displayName: "📝・changelog", category: "information", kind: "announcement", modes: STANDARD },
  { key: "suggestions", name: "suggestions", displayName: "💡・suggestions", category: "community", kind: "public", modes: STANDARD },
  { key: "giveaways", name: "giveaways", displayName: "🎉・giveaways", category: "community", kind: "public", modes: FULL },
  { key: "general", name: "general", displayName: "💬・general", category: "community", kind: "public", modes: STANDARD },
  { key: "support", name: "support", displayName: "🧭・support", category: "support", kind: "support", modes: BASIC },
  { key: "mxfFactions", name: "mxf-factions", displayName: "⚔️・mxf-factions", category: "products", kind: "product", productSlug: "mxf-factions", modes: STANDARD },
  { key: "mxfPrisons", name: "mxf-prisons", displayName: "⛏️・mxf-prisons", category: "products", kind: "product", productSlug: "mxf-prisons", modes: STANDARD },
  { key: "mxfSkyblock", name: "mxf-skyblock", displayName: "🌤️・mxf-skyblock", category: "products", kind: "product", productSlug: "mxf-skyblock", modes: STANDARD },
  { key: "mxfAioBot", name: "mxf-aio-bot", displayName: "🤖・mxf-aio-bot", category: "products", kind: "product", productSlug: "mxf-aio-bot", modes: STANDARD },
  { key: "createTicket", name: "create-ticket", displayName: "🎫・create-ticket", category: "support", kind: "support", modes: BASIC },
  { key: "supportInfo", name: "support-info", displayName: "📚・support-info", category: "support", kind: "support", modes: BASIC },
  { key: "faq", name: "faq", displayName: "❓・faq", category: "support", kind: "support", modes: BASIC },
  { key: "staffChat", name: "staff-chat", displayName: "👥・staff-chat", category: "staff", kind: "staff", modes: STANDARD },
  { key: "ticketLogs", name: "ticket-logs", displayName: "📜・ticket-logs", category: "staff", kind: "staff", logKey: "ticket", modes: STANDARD },
  { key: "moderationLogs", name: "moderation-logs", displayName: "🛡️・moderation-logs", category: "staff", kind: "staff", logKey: "moderation", modes: STANDARD },
  { key: "licenseLogs", name: "license-logs", displayName: "🔑・license-logs", category: "staff", kind: "staff", logKey: "license", modes: STANDARD },
  { key: "syncLogs", name: "sync-logs", displayName: "🔄・sync-logs", category: "staff", kind: "staff", logKey: "sync", modes: STANDARD },
  { key: "paymentLogs", name: "payment-logs", displayName: "💳・payment-logs", category: "staff", kind: "staff", logKey: "payment", modes: FULL },
  { key: "suspiciousActivity", name: "suspicious-activity", displayName: "🚨・suspicious-activity", category: "staff", kind: "staff", logKey: "suspicious", modes: STANDARD },
  { key: "botStatus", name: "bot-status", displayName: "🤖・bot-status", category: "staff", kind: "staff", logKey: "botStatus", modes: STANDARD },
  { key: "auditLogs", name: "audit-logs", displayName: "🧾・audit-logs", category: "logs", kind: "log", logKey: "audit", modes: STANDARD },
  { key: "automodLogs", name: "automod-logs", displayName: "🧯・automod-logs", category: "logs", kind: "log", logKey: "automod", modes: STANDARD },
  { key: "memberLogs", name: "member-logs", displayName: "👤・member-logs", category: "logs", kind: "log", logKey: "member", modes: STANDARD },
  { key: "messageLogs", name: "message-logs", displayName: "💬・message-logs", category: "logs", kind: "log", logKey: "message", modes: STANDARD },
  { key: "roleSyncLogs", name: "role-sync-logs", displayName: "🔁・role-sync-logs", category: "logs", kind: "log", logKey: "roleSync", modes: FULL },
  { key: "websiteSyncLogs", name: "website-sync-logs", displayName: "🌐・website-sync-logs", category: "logs", kind: "log", logKey: "websiteSync", modes: STANDARD },
];

const PRODUCTION_SETUP_ROLES: SetupRole[] = [
  { key: "owner", name: "MxF Owner", color: 0xff6262, group: "staff", modes: BASIC },
  { key: "admin", name: "MxF Admin", color: 0xff8a8a, group: "staff", modes: BASIC },
  { key: "developer", name: "MxF Developer", color: 0x7dd3fc, group: "staff", modes: STANDARD },
  { key: "support", name: "MxF Support", color: 0x86efac, group: "staff", modes: BASIC },
  { key: "moderator", name: "MxF Moderator", color: 0xa78bfa, group: "staff", modes: STANDARD },
  { key: "customer", name: "MxF Customer", color: 0xf7b955, group: "customer", modes: BASIC },
  { key: "verifiedCustomer", name: "Verified Customer", color: 0x5eead4, group: "customer", modes: BASIC },
  { key: "premiumSupport", name: "Premium Support", color: 0xfacc15, group: "customer", modes: STANDARD },
  { key: "betaTester", name: "Beta Tester", color: 0xa78bfa, group: "customer", modes: FULL },
  { key: "mxfFactions", name: "MxF Factions Owner", color: 0xff6262, group: "product", productSlug: "mxf-factions", modes: STANDARD },
  { key: "mxfPrisons", name: "MxF Prisons Owner", color: 0xf7b955, group: "product", productSlug: "mxf-prisons", modes: STANDARD },
  { key: "mxfSkyblock", name: "MxF Skyblock Owner", color: 0x86efac, group: "product", productSlug: "mxf-skyblock", modes: STANDARD },
  { key: "mxfAioBot", name: "MxF AIO Bot User", color: 0x7dd3fc, group: "product", productSlug: "mxf-aio-bot", modes: STANDARD },
  { key: "giveawayAccess", name: "Giveaway Ping", color: 0xf59e0b, group: "utility", modes: FULL },
  { key: "announcementPing", name: "Announcement Ping", color: 0xeab308, group: "utility", modes: FULL },
  { key: "updatePing", name: "Update Ping", color: 0x06b6d4, group: "utility", modes: FULL },
];

const PRODUCTION_SETUP_CATEGORIES: SetupCategory[] = [
  { key: "information", name: "INFORMATION", kind: "public", modes: BASIC },
  { key: "community", name: "COMMUNITY", kind: "public", modes: STANDARD },
  { key: "products", name: "PRODUCTS", kind: "product", modes: STANDARD },
  { key: "support", name: "SUPPORT", kind: "support", modes: BASIC },
  { key: "customerArea", name: "CUSTOMERS", kind: "customer", modes: STANDARD },
  { key: "staff", name: "STAFF", kind: "staff", modes: STANDARD },
  { key: "logs", name: "LOGS", kind: "log", modes: STANDARD },
  { key: "archivedTickets", name: "ARCHIVED", kind: "staff", modes: STANDARD },
];

const PRODUCTION_SETUP_CHANNELS: SetupChannel[] = [
  { key: "welcome", name: "welcome", category: "information", kind: "public", modes: BASIC },
  { key: "rules", name: "rules", category: "information", kind: "announcement", modes: BASIC },
  { key: "announcements", name: "announcements", category: "information", kind: "announcement", modes: BASIC },
  { key: "changelog", name: "changelog", category: "information", kind: "announcement", modes: STANDARD },
  { key: "productUpdates", name: "product-updates", category: "information", kind: "announcement", modes: STANDARD },
  { key: "faq", name: "faq", category: "information", kind: "public", modes: BASIC },
  { key: "general", name: "general", category: "community", kind: "public", modes: STANDARD },
  { key: "suggestions", name: "suggestions", category: "community", kind: "public", modes: STANDARD },
  { key: "polls", name: "polls", category: "community", kind: "public", modes: STANDARD },
  { key: "giveaways", name: "giveaways", category: "community", kind: "public", modes: FULL },
  { key: "mxfFactions", name: "mxf-factions", category: "products", kind: "product", productSlug: "mxf-factions", modes: STANDARD },
  { key: "mxfPrisons", name: "mxf-prisons", category: "products", kind: "product", productSlug: "mxf-prisons", modes: STANDARD },
  { key: "mxfSkyblock", name: "mxf-skyblock", category: "products", kind: "product", productSlug: "mxf-skyblock", modes: STANDARD },
  { key: "mxfAioBot", name: "mxf-aio-bot", category: "products", kind: "product", productSlug: "mxf-aio-bot", modes: STANDARD },
  { key: "createTicket", name: "create-ticket", category: "support", kind: "support", modes: BASIC },
  { key: "supportInfo", name: "support-info", category: "support", kind: "support", modes: BASIC },
  { key: "customerVerify", name: "customer-verify", category: "support", kind: "support", modes: BASIC },
  { key: "customerChat", name: "customer-chat", category: "customerArea", kind: "customer", modes: STANDARD },
  { key: "downloadsInfo", name: "downloads-info", category: "customerArea", kind: "customer", modes: STANDARD },
  { key: "licenseHelp", name: "license-help", category: "customerArea", kind: "customer", modes: STANDARD },
  { key: "staffChat", name: "staff-chat", category: "staff", kind: "staff", modes: STANDARD },
  { key: "staffDashboard", name: "staff-dashboard", category: "staff", kind: "staff", modes: STANDARD },
  { key: "ticketLogs", name: "ticket-logs", category: "staff", kind: "staff", logKey: "ticket", modes: STANDARD },
  { key: "licenseLogs", name: "license-logs", category: "staff", kind: "staff", logKey: "license", modes: STANDARD },
  { key: "paymentLogs", name: "payment-logs", category: "staff", kind: "staff", logKey: "payment", modes: STANDARD },
  { key: "suspiciousActivity", name: "suspicious-activity", category: "staff", kind: "staff", logKey: "suspicious", modes: STANDARD },
  { key: "auditLogs", name: "audit-logs", category: "logs", kind: "log", logKey: "audit", modes: STANDARD },
  { key: "automodLogs", name: "automod-logs", category: "logs", kind: "log", logKey: "automod", modes: STANDARD },
  { key: "moderationLogs", name: "moderation-logs", category: "logs", kind: "log", logKey: "moderation", modes: STANDARD },
  { key: "memberLogs", name: "member-logs", category: "logs", kind: "log", logKey: "member", modes: STANDARD },
  { key: "messageLogs", name: "message-logs", category: "logs", kind: "log", logKey: "message", modes: STANDARD },
  { key: "roleSyncLogs", name: "role-sync-logs", category: "logs", kind: "log", logKey: "roleSync", modes: STANDARD },
  { key: "websiteSyncLogs", name: "website-sync-logs", category: "logs", kind: "log", logKey: "websiteSync", modes: STANDARD },
  { key: "archiveIndex", name: "closed-ticket-logs", category: "archivedTickets", kind: "staff", logKey: "archive", modes: STANDARD },
];

SETUP_ROLES.splice(0, SETUP_ROLES.length, ...PRODUCTION_SETUP_ROLES);
SETUP_CATEGORIES.splice(0, SETUP_CATEGORIES.length, ...PRODUCTION_SETUP_CATEGORIES);
SETUP_CHANNELS.splice(0, SETUP_CHANNELS.length, ...PRODUCTION_SETUP_CHANNELS);

function displayChannelName(channel: SetupChannel) {
  return channel.displayName || channel.name;
}

export function normalizeSetupChannelName(name: string) {
  const lowered = name.toLowerCase();
  const afterDivider = lowered.includes("・") ? lowered.split("・").pop() || lowered : lowered;
  return afterDivider.replace(/^[^\p{Letter}\p{Number}#]+/u, "").replace(/^[\s-]+/, "");
}

function findCategory(guild: Guild, definition: SetupCategory) {
  return guild.channels.cache.find(
    (channel) => channel.type === ChannelType.GuildCategory && channel.name.toLowerCase() === definition.name.toLowerCase(),
  ) as CategoryChannel | undefined;
}

function findSetupChannel(guild: Guild, definition: SetupChannel) {
  const names = new Set([definition.name, displayChannelName(definition)].map(normalizeSetupChannelName));
  return guild.channels.cache.find(
    (channel) => channel.type !== ChannelType.GuildCategory && names.has(normalizeSetupChannelName(channel.name)),
  ) as TextChannel | undefined;
}

async function applyPermissionOverwrites(channel: GuildBasedChannel, overwrites: OverwriteResolvable[], reason: string) {
  if ("permissionOverwrites" in channel && typeof channel.permissionOverwrites.set === "function") {
    await channel.permissionOverwrites.set(overwrites, reason).catch(() => null);
  }
}

export function normalizeSetupMode(mode: string | null | undefined): SetupMode {
  if (mode === "basic" || mode === "standard" || mode === "full" || mode === "custom") return mode;
  return "standard";
}

function inMode<T extends { modes: SetupMode[] }>(item: T, mode: SetupMode) {
  return item.modes.includes(mode);
}

export function setupRoleDefinitions(mode: SetupMode) {
  return SETUP_ROLES.filter((role) => inMode(role, mode));
}

export function setupCategoryDefinitions(mode: SetupMode) {
  return SETUP_CATEGORIES.filter((category) => inMode(category, mode));
}

export function setupChannelDefinitions(mode: SetupMode) {
  return SETUP_CHANNELS.filter((channel) => inMode(channel, mode));
}

export function getMissingSetupPermissions(member: GuildMember | null | undefined) {
  if (!member) return REQUIRED_SETUP_PERMISSIONS.map((permission) => permission.label);
  return REQUIRED_SETUP_PERMISSIONS.filter((permission) => !member.permissions.has(permission.flag)).map((permission) => permission.label);
}

export async function assertSetupActor(input: { guild: Guild | null; actorId: string; memberPermissions?: { has(flag: bigint): boolean } | null }) {
  const isOwner = input.guild?.ownerId === input.actorId;
  const isAdmin = Boolean(input.memberPermissions?.has(PermissionFlagsBits.Administrator));
  return isOwner || isAdmin;
}

export async function buildSetupPlan(guild: Guild, mode: SetupMode) {
  const me = guild.members.me || (await guild.members.fetchMe().catch(() => null));
  const roleDefinitions = setupRoleDefinitions(mode);
  const categoryDefinitions = setupCategoryDefinitions(mode);
  const channelDefinitions = setupChannelDefinitions(mode);

  const missingPermissions = getMissingSetupPermissions(me || undefined);
  const roles = roleDefinitions.map((definition) => {
    const existing = guild.roles.cache.find((role) => role.name.toLowerCase() === definition.name.toLowerCase());
    return { ...definition, existingId: existing?.id || null, willCreate: !existing };
  });
  const categories = categoryDefinitions.map((definition) => {
    const existing = findCategory(guild, definition);
    return { ...definition, existingId: existing?.id || null, willCreate: !existing };
  });
  const channels = channelDefinitions.map((definition) => {
    const existing = findSetupChannel(guild, definition);
    return { ...definition, existingId: existing?.id || null, willCreate: !existing };
  });

  const hierarchyWarnings =
    me && roles.some((role) => role.existingId && (guild.roles.cache.get(role.existingId)?.comparePositionTo(me.roles.highest) ?? -1) >= 0)
      ? ["Some existing MxF roles are above or equal to the bot's highest role. Move the bot role above managed MxF roles before role sync/reset."]
      : [];

  return {
    mode,
    missingPermissions,
    hierarchyWarnings,
    roles,
    categories,
    channels,
    summary: {
      rolesToCreate: roles.filter((role) => role.willCreate).length,
      rolesExisting: roles.filter((role) => !role.willCreate).length,
      categoriesToCreate: categories.filter((category) => category.willCreate).length,
      channelsToCreate: channels.filter((channel) => channel.willCreate).length,
    },
  };
}

function staffRoleIds(roles: Map<string, Role | string>) {
  return ["owner", "admin", "developer", "support", "moderator"]
    .map((key) => roles.get(key))
    .map((role) => (typeof role === "string" ? role : role?.id))
    .filter(Boolean) as string[];
}

function adminRoleIds(roles: Map<string, Role | string>) {
  return ["owner", "admin", "developer"]
    .map((key) => roles.get(key))
    .map((role) => (typeof role === "string" ? role : role?.id))
    .filter(Boolean) as string[];
}

function roleId(roles: Map<string, Role | string>, key: string) {
  const role = roles.get(key);
  return typeof role === "string" ? role : role?.id;
}

function customerRoleIds(roles: Map<string, Role | string>) {
  return ["customer", "verifiedCustomer", "premiumSupport", "betaTester"]
    .map((key) => roleId(roles, key))
    .filter(Boolean) as string[];
}

function productRoleIds(roles: Map<string, Role | string>) {
  return SETUP_ROLES.filter((role) => role.productSlug)
    .map((role) => roleId(roles, role.key))
    .filter(Boolean) as string[];
}

function overwritesForChannel(guild: Guild, channel: SetupChannel, roles: Map<string, Role | string>): OverwriteResolvable[] {
  const everyone = guild.roles.everyone.id;
  const staffIds = staffRoleIds(roles);
  const adminIds = adminRoleIds(roles);
  const productRole = SETUP_ROLES.find((role) => role.productSlug === channel.productSlug);
  const resolvedProductRoleId = productRole ? roleId(roles, productRole.key) : undefined;
  const customerIds = customerRoleIds(roles);

  if (channel.kind === "staff" || channel.kind === "log") {
    return [
      { id: everyone, deny: [PermissionFlagsBits.ViewChannel] },
      ...adminIds.map((id) => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] })),
      ...staffIds.map((id) => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] })),
    ];
  }

  if (channel.kind === "customer") {
    return [
      { id: everyone, deny: [PermissionFlagsBits.ViewChannel] },
      ...customerIds.map((id) => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] })),
      ...productRoleIds(roles).map((id) => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] })),
      ...staffIds.map((id) => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] })),
    ];
  }

  if (channel.kind === "product") {
    return [
      { id: everyone, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      ...(resolvedProductRoleId ? [{ id: resolvedProductRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : []),
      ...staffIds.map((id) => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] })),
    ];
  }

  if (channel.kind === "announcement") {
    return [
      { id: everyone, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
      ...staffIds.map((id) => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] })),
    ];
  }

  return [{ id: everyone, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }];
}

async function sendSetupEmbedOnce(
  channel: TextChannel | null | undefined,
  title: string,
  description: string,
  fields: Record<string, string | number | boolean> = {},
  components: SetupComponentRow[] = [],
  visual: SetupEmbedVisual = {},
) {
  if (!channel?.isTextBased()) return;
  const existing = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  const existingMessage = existing?.find((message) => message.author.id === channel.client.user?.id && message.embeds.some((embed) => embed.title === title));
  const embed = mxfEmbed({
    title,
    description,
    color: visual.color,
    footer: visual.footer,
    image: visual.image,
    thumbnail: visual.thumbnail,
  });
  const fieldList = Object.entries(fields).map(([name, value]) => ({ name, value: String(value), inline: true }));
  if (fieldList.length) embed.addFields(fieldList);
  const payload = {
    embeds: [embed],
    components,
  };

  if (existingMessage) {
    await existingMessage.edit(payload).catch(() => null);
    return;
  }

  await channel.send(payload).catch(() => null);
}

type SetupContent = SetupContentResponse["content"] & {
  products: SetupContentResponse["products"];
};

function fallbackSetupContent(): SetupContent {
  return {
    welcomeEmbed: "A premium support and product community for MxF Labs customers, products, and custom development work.",
    faqEmbed: [
      "How do I buy a product? Use product pages or checkout links when products are public.",
      "How do I download? Use the customer portal after purchase or license assignment.",
      "Where is my license key? Your portal and license delivery message show it.",
      "How do I activate? Use the product docs and license validation flow.",
      "How do I open support? Use the ticket panel.",
    ].join("\n\n"),
    supportPanel: "Use the ticket panel for private help. Product, license, purchase, bug, and custom-order flows collect structured details before staff joins.",
    productPanel: "Select a product to verify ownership, access docs, and receive product roles.",
    ticketPanel: "Open a private ticket for support, licensing, purchases, bugs, product help, or custom orders.",
    giveawayEmbed: "Official giveaways will be posted here. Product ownership and account-age requirements may apply.",
    suggestionEmbed: "Post product ideas, workflow improvements, and community feedback. Staff will review and mark planned or implemented items.",
    roleLabels: {
      customer: "Customer",
      verified: "Verified Customer",
      premiumSupport: "Premium Support",
      betaTester: "Beta Tester",
    },
    products: [],
  };
}

async function loadSetupContent(website?: WebsiteApiClient): Promise<SetupContent> {
  if (!website) return fallbackSetupContent();
  const response = await website.setupContent();
  if (!response.ok) return fallbackSetupContent();
  return { ...response.data.content, products: response.data.products };
}

function siteBase() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.MXF_API_BASE_URL || "https://mxf-labs.com";
  return baseUrl.replace(/\/$/, "");
}

function discordAsset(path: string) {
  return `${siteBase()}${path.startsWith("/") ? path : `/${path}`}`;
}

function discordVisuals() {
  return {
    mark: discordAsset("/discord/mxf-mark.png"),
    welcome: discordAsset("/discord/panel-welcome.png"),
    rules: discordAsset("/discord/panel-rules.png"),
    tickets: discordAsset("/discord/panel-tickets.png"),
    products: discordAsset("/discord/panel-products.png"),
    verify: discordAsset("/discord/panel-verify.png"),
    community: discordAsset("/discord/panel-community.png"),
  };
}

function colorFromHex(value?: string | null) {
  if (!value) return undefined;
  const normalized = value.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return undefined;
  return Number.parseInt(normalized, 16);
}

function recordString(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const item = (value as Record<string, unknown>)[key];
  return typeof item === "string" ? item : "";
}

function customizedProductPanel(panel: (typeof productPanels)[number], content: SetupContent) {
  const product = content.products.find((item) => item.slug === panel.slug);
  if (!product) {
    return { ...panel, summary: `${content.productPanel}\n\n${panel.summary}` };
  }

  const discord = product.discord || {};
  if (discord.enabled === false || discord.visibility === "hidden") return null;
  const displayAccent = typeof product.display?.accentColor === "string" ? product.display.accentColor : "";
  const mediaBanner = recordString(product.media, "featuredImage") || recordString(product.media, "heroImage");
  const mediaThumbnail = recordString(product.media, "cardImage");
  const configuredButtons = (discord.buttons?.length ? discord.buttons : product.buttons || [])
    .map((button) => ({ label: button.label, href: button.href }))
    .filter((button) => button.label && button.href);

  return {
    ...panel,
    name: discord.title || product.name || panel.name,
    subtitle: discord.subtitle || product.category || panel.subtitle,
    summary: discord.description || product.shortDescription || panel.summary,
    features: (discord.features?.length ? discord.features : product.highlightedFeatures?.length ? product.highlightedFeatures : product.features.length ? product.features : panel.features).slice(0, 4),
    price: product.price || panel.price,
    status: product.status || panel.status,
    docsPath: product.documentationLink || panel.docsPath,
    supportPath: product.supportLink || panel.supportPath,
    category: product.category || panel.category,
    accentColor: colorFromHex(discord.accentColor || displayAccent),
    bannerImage: discord.bannerImage || discord.artworkImage || mediaBanner || panel.bannerImage,
    thumbnailImage: discord.thumbnailImage || mediaThumbnail || panel.thumbnailImage,
    buttons: configuredButtons.length ? configuredButtons : panel.buttons,
  };
}

async function sendProductPanelOnce(channel: TextChannel | null | undefined, panel: (typeof productPanels)[number], content: SetupContent) {
  if (!channel?.isTextBased()) return;
  const existing = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  const nextPanel = customizedProductPanel(panel, content);
  if (!nextPanel) return;
  const payload = {
    embeds: [productPanelEmbed(nextPanel)],
    components: productPanelButtons(nextPanel),
  };
  const existingMessage = existing?.find((message) =>
    message.author.id === channel.client.user?.id &&
    message.embeds.some((embed) => embed.title === nextPanel.name || (["MxF Labs Product Panel", "MxF Labs", "MxF Labs | Software studio"].includes(embed.footer?.text || "") && embed.title === panel.name)),
  );

  if (existingMessage) {
    await existingMessage.edit(payload).catch(() => null);
    return;
  }

  await channel.send(payload).catch(() => null);
}

function faqComponents() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.MXF_API_BASE_URL || "https://mxf-labs.com";
  const site = baseUrl.replace(/\/$/, "");
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel("Customer Portal").setStyle(ButtonStyle.Link).setURL(`${site}/portal`),
      new ButtonBuilder().setCustomId("ticket:create:general").setLabel("Open Ticket").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("ticket:create:license").setLabel("License Help").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setLabel("Docs").setStyle(ButtonStyle.Link).setURL(`${site}/docs`),
    ),
  ];
}

function productShopComponents() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.MXF_API_BASE_URL || "https://mxf-labs.com";
  const site = baseUrl.replace(/\/$/, "");
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...productPanels.slice(0, 4).map((panel) =>
        new ButtonBuilder()
          .setLabel(panel.name.replace(/^MxF\s+/i, ""))
          .setStyle(ButtonStyle.Link)
          .setURL(`${site}/products/${panel.slug}`),
      ),
      new ButtonBuilder().setLabel("Website").setStyle(ButtonStyle.Link).setURL(site),
    ),
  ];
}

function welcomeComponents() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.MXF_API_BASE_URL || "https://mxf-labs.com";
  const site = baseUrl.replace(/\/$/, "");
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel("View Products").setStyle(ButtonStyle.Link).setURL(`${site}/products`),
      new ButtonBuilder().setCustomId("account:verify").setLabel("Link Account").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("ticket:create:general").setLabel("Open Ticket").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setLabel("Read Docs").setStyle(ButtonStyle.Link).setURL(`${site}/docs`),
    ),
  ];
}

function rulesComponents() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.MXF_API_BASE_URL || "https://mxf-labs.com";
  const site = baseUrl.replace(/\/$/, "");
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("rules:accept").setLabel("Accept Rules").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setLabel("Terms").setStyle(ButtonStyle.Link).setURL(`${site}/terms`),
      new ButtonBuilder().setLabel("Privacy").setStyle(ButtonStyle.Link).setURL(`${site}/privacy`),
    ),
  ];
}

function suggestionComponents() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.MXF_API_BASE_URL || "https://mxf-labs.com";
  const site = baseUrl.replace(/\/$/, "");
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("suggestion:submit").setLabel("Submit Suggestion").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setLabel("View Roadmap").setStyle(ButtonStyle.Link).setURL(`${site}/products`),
    ),
  ];
}

function giveawayPanelComponents() {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("ping:toggle:giveawayAccess").setLabel("Toggle Giveaway Ping").setStyle(ButtonStyle.Secondary),
    ),
  ];
}

function customerVerifyComponents() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.MXF_API_BASE_URL || "https://mxf-labs.com";
  const site = baseUrl.replace(/\/$/, "");
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("account:verify").setLabel("Link Account").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("account:sync-roles").setLabel("Claim Roles").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setLabel("Customer Portal").setStyle(ButtonStyle.Link).setURL(`${site}/portal`),
      new ButtonBuilder().setLabel("Licenses").setStyle(ButtonStyle.Link).setURL(`${site}/portal/licenses`),
    ),
  ];
}

async function seedPremiumSetupEmbeds(input: {
  guild: Guild;
  channelMap: Map<string, string>;
  mode: SetupMode;
  productRoleMap: Record<string, string>;
  websiteSync: string;
  content: SetupContent;
}) {
  const channel = async (key: string) => {
    const id = input.channelMap.get(key);
    const fetched = id ? await input.guild.channels.fetch(id).catch(() => null) : null;
    return fetched?.isTextBased() ? (fetched as TextChannel) : null;
  };
  const visuals = discordVisuals();

  await sendSetupEmbedOnce(
    await channel("welcome"),
    "Welcome To MxF Labs",
    [
      "Premium software, plugins, bots, licensing, and support in one connected workspace.",
      "- Browse products and roadmap.",
      "- Link your account for customer access.",
      "- Open private support with the right context.",
    ].join("\n\n"),
    {
      Platform: "Minecraft products, Discord tooling, licensing",
      Access: "Account linking, support, product roles",
    },
    welcomeComponents(),
    { image: visuals.welcome, thumbnail: visuals.mark },
  );
  await sendSetupEmbedOnce(
    await channel("rules"),
    "MxF Labs Rules",
    [
      "1. Keep support, licensing, and payment details inside private tickets.",
      "2. Do not share license keys, customer files, private downloads, or account data.",
      "3. Keep product feedback specific, respectful, and useful.",
      "4. Use the correct ticket path for account, billing, bug, or custom work.",
      "5. Staff decisions protect customers, products, and the MxF Labs ecosystem.",
    ].join("\n"),
    {},
    rulesComponents(),
    { image: visuals.rules, thumbnail: visuals.mark },
  );
  await sendSetupEmbedOnce(
    await channel("announcements"),
    "MxF Labs Announcements",
    "Official launch notes, maintenance windows, availability updates, and customer-facing product news.",
    {},
    [],
    { thumbnail: visuals.mark },
  );
  await sendSetupEmbedOnce(
    await channel("productUpdates"),
    "MxF Labs Product Shop",
    (input.content.products.length ? input.content.products : productPanels)
      .slice(0, 4)
      .map((panel) => `**${panel.name}**\n${panel.price} / ${panel.status}`)
      .join("\n"),
    {},
    productShopComponents(),
    { image: visuals.products, thumbnail: visuals.mark },
  );
  await sendSetupEmbedOnce(await channel("changelog"), "Platform Changelog", "Release notes and product updates from MxF Labs.", {}, [], { thumbnail: visuals.mark });
  await sendSetupEmbedOnce(await channel("general"), "MxF Labs General", "Community discussion for the MxF Labs ecosystem.", {}, [], { thumbnail: visuals.mark });
  await sendSetupEmbedOnce(await channel("suggestions"), "Suggestions Panel", input.content.suggestionEmbed, {}, suggestionComponents(), { image: visuals.community, thumbnail: visuals.mark });
  await sendSetupEmbedOnce(await channel("polls"), "Polls Panel", "Product direction votes and community polls.", {}, [], { thumbnail: visuals.mark });
  await sendSetupEmbedOnce(await channel("giveaways"), "Giveaway Panel", input.content.giveawayEmbed, {}, giveawayPanelComponents(), { image: visuals.community, thumbnail: visuals.mark });
  await sendSetupEmbedOnce(await channel("supportInfo"), "Support Information", input.content.supportPanel, {}, [], { thumbnail: visuals.mark });
  await sendSetupEmbedOnce(
    await channel("customerVerify"),
    "Customer Verify Panel",
    "Link your account once. Product roles, ownership, downloads, license context, and support routing stay in sync from there.",
    {},
    customerVerifyComponents(),
    { image: visuals.verify, thumbnail: visuals.mark },
  );
  await sendSetupEmbedOnce(
    await channel("createTicket"),
    "MxF Labs Support",
    [
      "Choose the path that best fits your request. Tickets are private, structured, and routed with enough context for faster answers.",
      input.content.ticketPanel,
    ].join("\n\n"),
    {},
    ticketPanelComponents(),
    { image: visuals.tickets, thumbnail: visuals.mark },
  );
  await sendSetupEmbedOnce(
    await channel("faq"),
    "MxF Labs FAQ",
    input.content.faqEmbed,
    {},
    faqComponents(),
    { image: visuals.community, thumbnail: visuals.mark },
  );
  await sendSetupEmbedOnce(await channel("customerChat"), "Customer Chat", "A clean customer-only space for product discussion.");
  await sendSetupEmbedOnce(await channel("downloadsInfo"), "Downloads Information", "Downloads live in the customer portal behind signed links.");
  await sendSetupEmbedOnce(await channel("licenseHelp"), "License Help", "Need account or license help? Open a private ticket before sharing keys.", {}, faqComponents());
  for (const panel of productPanels) {
    await sendProductPanelOnce(await channel(panel.channelKey), panel, input.content);
  }
  await sendSetupEmbedOnce(await channel("staffChat"), "Staff Operations", "Coordinate support, moderation, license reviews, product releases, and customer escalations here.");
  await sendSetupEmbedOnce(await channel("staffDashboard"), "Staff Dashboard", "Operational shortcuts for ticket flow, license reviews, payment checks, suspicious activity, website sync, and launch readiness.");
  await sendSetupEmbedOnce(await channel("ticketLogs"), "Ticket Logs", "Ticket creation, claims, transcripts, close events, and sync failures are logged here.");
  await sendSetupEmbedOnce(await channel("licenseLogs"), "License Logs", "License create, lookup, reset, suspend, revoke, transfer, and sync actions are logged here with masked keys.");
  await sendSetupEmbedOnce(await channel("paymentLogs"), "Payment Logs", "Payment, manual order, refund, and checkout lifecycle events can be routed here.");
  await sendSetupEmbedOnce(await channel("suspiciousActivity"), "Suspicious Activity", "License sharing, unusual validations, account mismatch, and fraud-review flags are routed here.");
  await sendSetupEmbedOnce(await channel("auditLogs"), "Audit Logs", "High-signal administrative changes and setup actions appear here.");
  await sendSetupEmbedOnce(await channel("automodLogs"), "AutoMod Logs", "Automod triggers, blocked terms, spam checks, and review notes appear here.");
  await sendSetupEmbedOnce(await channel("moderationLogs"), "Moderation Logs", "Moderation cases, warnings, locks, unlocks, and member safety actions are tracked here.");
  await sendSetupEmbedOnce(await channel("memberLogs"), "Member Logs", "Member joins, leaves, onboarding status, account link events, and customer sync outcomes appear here.");
  await sendSetupEmbedOnce(await channel("messageLogs"), "Message Logs", "Message moderation events and staff-reviewed content actions appear here.");
  await sendSetupEmbedOnce(await channel("roleSyncLogs"), "Role Sync Logs", "Product ownership, customer verification, and ping-role sync events appear here.");
  await sendSetupEmbedOnce(await channel("websiteSyncLogs"), "Website Sync Logs", "Website API sync, queued events, retry state, and outage recovery notes appear here.");
  await sendSetupEmbedOnce(await channel("archiveIndex"), "Archived Tickets", "Closed ticket transcripts and log references belong here for staff review and customer history lookup.");
}

export async function applySetup(input: { guild: Guild; actorId: string; mode: SetupMode; website: WebsiteApiClient }) {
  const plan = await buildSetupPlan(input.guild, input.mode);

  if (plan.missingPermissions.length) {
    return { ok: false as const, reason: "missing_permissions", plan, createdRoles: [], createdChannels: [], websiteSync: "Skipped" };
  }

  const roleMap = new Map<string, Role | string>();
  const createdRoles: Array<{ key: string; id: string; name: string }> = [];
  const createdChannels: Array<{ key: string; id: string; name: string; type: string }> = [];
  const reason = `MxF Labs setup by ${input.actorId}`;

  for (const roleDefinition of setupRoleDefinitions(input.mode)) {
    const existing = input.guild.roles.cache.find((role) => role.name.toLowerCase() === roleDefinition.name.toLowerCase());
    if (existing) {
      roleMap.set(roleDefinition.key, existing);
      continue;
    }

    const role = await input.guild.roles.create({
      name: roleDefinition.name,
      color: roleDefinition.color,
      mentionable: false,
      reason,
    });
    roleMap.set(roleDefinition.key, role);
    createdRoles.push({ key: roleDefinition.key, id: role.id, name: role.name });
  }

  const categoryMap = new Map<string, string>();
  for (const categoryDefinition of setupCategoryDefinitions(input.mode)) {
    const existing = findCategory(input.guild, categoryDefinition);
    const protectedCategory = categoryDefinition.kind === "customer" || categoryDefinition.kind === "staff" || categoryDefinition.kind === "log";
    if (existing) {
      categoryMap.set(categoryDefinition.key, existing.id);
      if (protectedCategory) {
        await applyPermissionOverwrites(
          existing,
          overwritesForChannel(input.guild, { key: categoryDefinition.key, name: categoryDefinition.name, category: categoryDefinition.key, kind: categoryDefinition.kind, modes: [input.mode] }, roleMap),
          reason,
        );
      }
      continue;
    }

    const categoryOptions: GuildChannelCreateOptions = {
      name: categoryDefinition.name,
      type: ChannelType.GuildCategory,
      reason,
    };
    if (protectedCategory) {
      categoryOptions.permissionOverwrites = overwritesForChannel(input.guild, { key: categoryDefinition.key, name: categoryDefinition.name, category: categoryDefinition.key, kind: categoryDefinition.kind, modes: [input.mode] }, roleMap);
    }
    const category = await input.guild.channels.create(categoryOptions);
    categoryMap.set(categoryDefinition.key, category.id);
    createdChannels.push({ key: categoryDefinition.key, id: category.id, name: category.name, type: "category" });
  }

  const channelMap = new Map<string, string>();
  const logChannelIds: Record<string, string> = {};
  const previousConfig = await prisma.botGuildConfig.findUnique({ where: { guildId: input.guild.id } });
  const trackedChannelIds = parseJson<string[]>(previousConfig?.botCreatedChannelIdsJson, []);
  for (const channelDefinition of setupChannelDefinitions(input.mode)) {
    const existing = findSetupChannel(input.guild, channelDefinition);
    if (existing) {
      const parentId = categoryMap.get(channelDefinition.category);
      const desiredName = displayChannelName(channelDefinition);
      if (trackedChannelIds.includes(existing.id) && existing.name !== desiredName) {
        await existing.setName(desiredName, "MxF Labs setup branding repair").catch(() => null);
      }
      if (parentId && existing.parentId !== parentId) {
        await existing.setParent(parentId, { lockPermissions: false, reason }).catch(() => null);
      }
      await applyPermissionOverwrites(existing, overwritesForChannel(input.guild, channelDefinition, roleMap), reason);
      channelMap.set(channelDefinition.key, existing.id);
      if (channelDefinition.logKey) logChannelIds[channelDefinition.logKey] = existing.id;
      continue;
    }

    const channel = await input.guild.channels.create({
      name: displayChannelName(channelDefinition),
      type: ChannelType.GuildText,
      parent: categoryMap.get(channelDefinition.category),
      topic: `MxF Labs ${channelDefinition.name} channel provisioned by /setup.`,
      permissionOverwrites: overwritesForChannel(input.guild, channelDefinition, roleMap),
      reason,
    });
    channelMap.set(channelDefinition.key, channel.id);
    if (channelDefinition.logKey) logChannelIds[channelDefinition.logKey] = channel.id;
    createdChannels.push({ key: channelDefinition.key, id: channel.id, name: channel.name, type: "text" });
  }

  const ticketPanelChannelId = channelMap.get("createTicket");
  const ticketPanelChannel = ticketPanelChannelId ? await input.guild.channels.fetch(ticketPanelChannelId).catch(() => null) : null;
  const setupContent = await loadSetupContent(input.website);
  if (ticketPanelChannel?.isTextBased() && "send" in ticketPanelChannel) {
    const existingPanel = await ticketPanelChannel.messages.fetch({ limit: 20 }).catch(() => null);
    if (!existingPanel?.some((message) => message.author.id === input.guild.client.user?.id && message.components.length > 0 && message.embeds.some((embed) => embed.title === "MxF Labs Support"))) {
      const visuals = discordVisuals();
      await ticketPanelChannel.send({
        embeds: [
          mxfEmbed({
            title: "MxF Labs Support",
            description: [
              "Choose the path that best fits your request. Tickets are private, structured, and routed with enough context for faster answers.",
              setupContent.ticketPanel,
            ].join("\n\n"),
            image: visuals.tickets,
            thumbnail: visuals.mark,
          }),
        ],
        components: ticketPanelComponents(),
      });
    }
  }

  const productRoleMap: Record<string, string> = {};
  for (const roleDefinition of setupRoleDefinitions(input.mode).filter((role) => role.productSlug)) {
    const role = roleMap.get(roleDefinition.key);
    const roleId = typeof role === "string" ? role : role?.id;
    if (roleDefinition.productSlug && roleId) productRoleMap[roleDefinition.productSlug] = roleId;
  }

  const supportRoleIds = staffRoleIds(roleMap);
  const adminRoles = adminRoleIds(roleMap);
  const customerRole = roleMap.get("customer");
  const verifiedRole = roleMap.get("verifiedCustomer");
  const premiumRole = roleMap.get("premiumSupport");
  const betaRole = roleMap.get("betaTester");
  const createdRoleIds = createdRoles.map((role) => role.id);
  const createdChannelIds = createdChannels.map((channel) => channel.id);

  const setupPayload = {
    guildId: input.guild.id,
    guildName: input.guild.name,
    ownerId: input.guild.ownerId,
    setupMode: input.mode,
    createdRoles,
    createdChannels,
    ticketCategoryId: categoryMap.get("support") || null,
    ticketPanelChannelId: ticketPanelChannelId || null,
    logChannelIds,
    productRoleIds: productRoleMap,
    supportRoleIds,
    timestamp: new Date().toISOString(),
  };

  const websiteSync = await input.website.setupSync(setupPayload);
  if (!websiteSync.ok) {
    await queueWebsiteEvent({ guildId: input.guild.id, eventType: "discord.setup_sync", payload: setupPayload });
  }

  const config = await prisma.botGuildConfig.upsert({
    where: { guildId: input.guild.id },
    update: {
      guildName: input.guild.name,
      setupMode: input.mode,
      ownerId: input.guild.ownerId,
      setupCompleted: true,
      ticketCategoryId: categoryMap.get("support") || null,
      ticketPanelChannelId: ticketPanelChannelId || null,
      logChannelId: channelMap.get("websiteSyncLogs") || channelMap.get("auditLogs") || channelMap.get("licenseLogs") || null,
      modLogChannelId: channelMap.get("moderationLogs") || channelMap.get("automodLogs") || null,
      suggestionChannelId: channelMap.get("suggestions") || null,
      giveawayChannelId: channelMap.get("giveaways") || null,
      announcementChannelId: channelMap.get("announcements") || null,
      welcomeChannelId: channelMap.get("welcome") || null,
      supportRoleIdsJson: toJson(supportRoleIds),
      adminRoleIdsJson: toJson(adminRoles),
      productRoleMapJson: toJson(productRoleMap),
      customerRoleId: typeof customerRole === "string" ? customerRole : customerRole?.id || null,
      verifiedCustomerRoleId: typeof verifiedRole === "string" ? verifiedRole : verifiedRole?.id || null,
      premiumSupportRoleId: typeof premiumRole === "string" ? premiumRole : premiumRole?.id || null,
      betaTesterRoleId: typeof betaRole === "string" ? betaRole : betaRole?.id || null,
      logChannelIdsJson: toJson(logChannelIds),
      botCreatedRoleIdsJson: toJson(createdRoleIds),
      botCreatedChannelIdsJson: toJson(createdChannelIds),
      setupPlanJson: toJson(plan),
      websiteSyncStatus: websiteSync.ok ? "Synced" : "Queued",
      lastSyncedAt: websiteSync.ok ? new Date() : null,
    },
    create: {
      guildId: input.guild.id,
      guildName: input.guild.name,
      setupMode: input.mode,
      ownerId: input.guild.ownerId,
      setupCompleted: true,
      ticketCategoryId: categoryMap.get("support") || null,
      ticketPanelChannelId: ticketPanelChannelId || null,
      logChannelId: channelMap.get("websiteSyncLogs") || channelMap.get("auditLogs") || channelMap.get("licenseLogs") || null,
      modLogChannelId: channelMap.get("moderationLogs") || channelMap.get("automodLogs") || null,
      suggestionChannelId: channelMap.get("suggestions") || null,
      giveawayChannelId: channelMap.get("giveaways") || null,
      announcementChannelId: channelMap.get("announcements") || null,
      welcomeChannelId: channelMap.get("welcome") || null,
      supportRoleIdsJson: toJson(supportRoleIds),
      adminRoleIdsJson: toJson(adminRoles),
      productRoleMapJson: toJson(productRoleMap),
      customerRoleId: typeof customerRole === "string" ? customerRole : customerRole?.id || null,
      verifiedCustomerRoleId: typeof verifiedRole === "string" ? verifiedRole : verifiedRole?.id || null,
      premiumSupportRoleId: typeof premiumRole === "string" ? premiumRole : premiumRole?.id || null,
      betaTesterRoleId: typeof betaRole === "string" ? betaRole : betaRole?.id || null,
      logChannelIdsJson: toJson(logChannelIds),
      botCreatedRoleIdsJson: toJson(createdRoleIds),
      botCreatedChannelIdsJson: toJson(createdChannelIds),
      setupPlanJson: toJson(plan),
      websiteSyncStatus: websiteSync.ok ? "Synced" : "Queued",
      lastSyncedAt: websiteSync.ok ? new Date() : null,
      automodConfigJson: "{}",
      ticketConfigJson: "{}",
      licensingConfigJson: "{}",
    },
  });

  await prisma.botLog.create({
    data: {
      guildId: input.guild.id,
      actorId: input.actorId,
      action: "applied setup wizard",
      area: "Setup",
      severity: websiteSync.ok ? "Info" : "Warning",
      metadataJson: toJson({ mode: input.mode, createdRoles, createdChannels, websiteSync: websiteSync.ok ? "Synced" : websiteSync.message }),
    },
  });

  await seedPremiumSetupEmbeds({
    guild: input.guild,
    channelMap,
    mode: input.mode,
    productRoleMap,
    websiteSync: websiteSync.ok ? "Synced" : "Queued",
    content: setupContent,
  });

  return { ok: true as const, plan, config, createdRoles, createdChannels, websiteSync: websiteSync.ok ? "Synced" : "Queued" };
}

export async function repairSetup(input: { guild: Guild; actorId: string; mode: SetupMode; website: WebsiteApiClient; target?: SetupRepairTarget }) {
  return applySetup(input);
}

export async function refreshSetupContent(input: { guild: Guild; actorId: string; mode?: SetupMode; website?: WebsiteApiClient }) {
  const config = await prisma.botGuildConfig.findUnique({ where: { guildId: input.guild.id } });
  const mode = normalizeSetupMode(input.mode || config?.setupMode || "standard");
  const channelMap = new Map<string, string>();
  const setupContent = await loadSetupContent(input.website);

  for (const channelDefinition of setupChannelDefinitions(mode)) {
    const channel = findSetupChannel(input.guild, channelDefinition);
    if (channel) channelMap.set(channelDefinition.key, channel.id);
  }

  await seedPremiumSetupEmbeds({
    guild: input.guild,
    channelMap,
    mode,
    productRoleMap: parseJson<Record<string, string>>(config?.productRoleMapJson, {}),
    websiteSync: config?.websiteSyncStatus || "Not Synced",
    content: setupContent,
  });

  await prisma.botLog.create({
    data: {
      guildId: input.guild.id,
      actorId: input.actorId,
      action: "refreshed setup content",
      area: "Setup",
      metadataJson: toJson({ mode, seededChannels: channelMap.size, productPanels: productPanels.length }),
    },
  });

  return { mode, seededChannels: channelMap.size, productPanels: productPanels.length };
}

export async function syncSetupWebsite(input: { guild: Guild; actorId: string; website: WebsiteApiClient }) {
  const config = await prisma.botGuildConfig.findUnique({ where: { guildId: input.guild.id } });
  const payload = {
    guildId: input.guild.id,
    guildName: input.guild.name,
    ownerId: input.guild.ownerId,
    setupMode: config?.setupMode || "standard",
    createdRoles: parseJson<string[]>(config?.botCreatedRoleIdsJson, []),
    createdChannels: parseJson<string[]>(config?.botCreatedChannelIdsJson, []),
    ticketCategoryId: config?.ticketCategoryId || null,
    ticketPanelChannelId: config?.ticketPanelChannelId || null,
    logChannelIds: parseJson<Record<string, string>>(config?.logChannelIdsJson, {}),
    productRoleIds: parseJson<Record<string, string>>(config?.productRoleMapJson, {}),
    supportRoleIds: parseJson<string[]>(config?.supportRoleIdsJson, []),
    timestamp: new Date().toISOString(),
  };
  const result = await input.website.setupSync(payload);
  await prisma.botGuildConfig.upsert({
    where: { guildId: input.guild.id },
    update: { websiteSyncStatus: result.ok ? "Synced" : "Queued", lastSyncedAt: result.ok ? new Date() : undefined },
    create: {
      guildId: input.guild.id,
      guildName: input.guild.name,
      setupMode: normalizeSetupMode(config?.setupMode),
      websiteSyncStatus: result.ok ? "Synced" : "Queued",
      lastSyncedAt: result.ok ? new Date() : undefined,
    },
  });
  if (!result.ok) {
    await queueWebsiteEvent({ guildId: input.guild.id, eventType: "discord.setup_sync", payload });
  }
  return result;
}

export async function syncSetupRoles(input: { guild: Guild; website: WebsiteApiClient; limit?: number }) {
  const members = await input.guild.members.fetch({ limit: input.limit || 100 }).catch(() => null);
  if (!members) return { checked: 0, plannedAdds: 0, plannedRemoves: 0 };

  let checked = 0;
  let plannedAdds = 0;
  let plannedRemoves = 0;
  for (const member of members.values()) {
    if (member.user.bot) continue;
    const plan = await buildRoleSyncPlan({
      website: input.website,
      guildId: input.guild.id,
      discordId: member.id,
      currentRoleIds: [...member.roles.cache.keys()],
    });
    checked += 1;
    plannedAdds += plan.add.length;
    plannedRemoves += plan.remove.length;
    for (const roleId of plan.add) await member.roles.add(roleId, "MxF Labs setup role sync").catch(() => null);
    for (const roleId of plan.remove) await member.roles.remove(roleId, "MxF Labs setup role sync").catch(() => null);
  }

  return { checked, plannedAdds, plannedRemoves };
}

function uniqueById<T extends { id: string }>(items: Array<T | null | undefined>) {
  return [...new Map(items.filter(Boolean).map((item) => [item!.id, item!] as const)).values()];
}

function setupPanelTitles() {
  return new Set([
    "Welcome To MxF Labs",
    "MxF Labs Rules",
    "MxF Labs Announcements",
    "MxF Labs Product Shop",
    "Platform Changelog",
    "MxF Labs General",
    "Suggestions Panel",
    "Polls Panel",
    "Giveaway Panel",
    "Support Information",
    "Customer Verify Panel",
    "MxF Labs Support",
    "MxF Labs FAQ",
    "Customer Chat",
    "Downloads Information",
    "License Help",
    "Staff Operations",
    "Staff Dashboard",
    "Ticket Logs",
    "License Logs",
    "Payment Logs",
    "Suspicious Activity",
    "Audit Logs",
    "AutoMod Logs",
    "Moderation Logs",
    "Member Logs",
    "Message Logs",
    "Role Sync Logs",
    "Website Sync Logs",
    "Archived Tickets",
    ...productPanels.map((panel) => panel.name),
  ]);
}

function setupChannelMatchesDefinition(channel: TextChannel, definition: SetupChannel, categories: SetupCategory[]) {
  const channelNameMatches = normalizeSetupChannelName(channel.name) === normalizeSetupChannelName(definition.name);
  if (!channelNameMatches) return false;

  const parentName = channel.parent ? channel.parent.name.toLowerCase() : "";
  const expectedCategory = categories.find((category) => category.key === definition.category);
  const inExpectedCategory = Boolean(expectedCategory && parentName === expectedCategory.name.toLowerCase());
  const setupTopic = (channel.topic || "").toLowerCase().includes("mxf labs") && (channel.topic || "").toLowerCase().includes("setup");

  return inExpectedCategory || setupTopic;
}

async function collectSetupTextChannels(guild: Guild, trackedChannelIds: string[]) {
  const definitions = setupChannelDefinitions("full");
  const categories = setupCategoryDefinitions("full");
  const tracked = await Promise.all(
    trackedChannelIds.map(async (channelId) => {
      const channel = await guild.channels.fetch(channelId).catch(() => null);
      return channel?.type === ChannelType.GuildText ? (channel as TextChannel) : null;
    }),
  );
  const named = definitions
    .map((definition) =>
      guild.channels.cache.find(
        (channel) =>
          channel.type === ChannelType.GuildText &&
          setupChannelMatchesDefinition(channel as TextChannel, definition, categories),
      ) as TextChannel | undefined,
    )
    .filter(Boolean) as TextChannel[];

  return uniqueById([...tracked, ...named]);
}

function collectSetupCategories(guild: Guild, textChannels: TextChannel[], trackedChannelIds: string[]) {
  const definitions = setupCategoryDefinitions("full");
  const tracked = trackedChannelIds
    .map((channelId) => guild.channels.cache.get(channelId))
    .filter((channel): channel is CategoryChannel => channel?.type === ChannelType.GuildCategory);
  const named = definitions
    .map((definition) => findCategory(guild, definition))
    .filter((category): category is CategoryChannel => Boolean(category))
    .filter((category) => textChannels.some((channel) => channel.parentId === category.id) || category.name.startsWith("MXF ") || ["CUSTOMERS", "STAFF", "LOGS", "ARCHIVED", "PRODUCTS"].includes(category.name));

  return uniqueById([...tracked, ...named]);
}

async function purgeSetupPanels(guild: Guild, trackedChannelIds: string[]) {
  const titles = setupPanelTitles();
  const channels = await collectSetupTextChannels(guild, trackedChannelIds);
  let deletedPanels = 0;

  for (const channel of channels) {
    const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
    if (!messages) continue;
    for (const message of messages.values()) {
      const botAuthored = message.author.id === guild.client.user?.id;
      if (!botAuthored) continue;
      const brandedEmbed = message.embeds.some((embed) => {
        const footer = embed.footer?.text || "";
        return Boolean((embed.title && titles.has(embed.title)) || footer.includes("MxF Labs") || footer.includes("Product Panel"));
      });
      if (!brandedEmbed && !message.components.length) continue;
      const deleted = await message.delete().then(() => true).catch(() => false);
      if (deleted) deletedPanels += 1;
    }
  }

  return deletedPanels;
}

async function deleteSetupChannels(guild: Guild, actorId: string, trackedChannelIds: string[]) {
  const textChannels = await collectSetupTextChannels(guild, trackedChannelIds);
  const categories = collectSetupCategories(guild, textChannels, trackedChannelIds);
  let deletedChannels = 0;

  for (const channel of textChannels) {
    const deleted = await channel.delete(`MxF Labs setup reset by ${actorId}`).then(() => true).catch(() => false);
    if (deleted) deletedChannels += 1;
  }

  for (const category of categories) {
    const deleted = await category.delete(`MxF Labs setup reset by ${actorId}`).then(() => true).catch(() => false);
    if (deleted) deletedChannels += 1;
  }

  return deletedChannels;
}

async function deleteSetupRoles(guild: Guild, actorId: string, trackedRoleIds: string[]) {
  const roleNames = new Set(setupRoleDefinitions("full").map((role) => role.name.toLowerCase()));
  const tracked = await Promise.all(trackedRoleIds.map((roleId) => guild.roles.fetch(roleId).catch(() => null)));
  const named = guild.roles.cache.filter((role) => roleNames.has(role.name.toLowerCase())).map((role) => role);
  const roles = uniqueById([...tracked, ...named]);
  let deletedRoles = 0;

  for (const role of roles) {
    if (role.managed || !role.editable) continue;
    const deleted = await role.delete(`MxF Labs setup reset by ${actorId}`).then(() => true).catch(() => false);
    if (deleted) deletedRoles += 1;
  }

  return deletedRoles;
}

export async function resetSetup(input: { guild: Guild; actorId: string; option: SetupResetOption }) {
  const config = await prisma.botGuildConfig.findUnique({ where: { guildId: input.guild.id } });
  if (!config) return { deletedChannels: 0, deletedRoles: 0, deletedPanels: 0, configReset: false };

  const trackedChannelIds = parseJson<string[]>(config.botCreatedChannelIdsJson, []);
  const trackedRoleIds = parseJson<string[]>(config.botCreatedRoleIdsJson, []);
  let deletedChannels = 0;
  let deletedRoles = 0;
  let deletedPanels = 0;

  if (input.option === "panels" || input.option === "channels" || input.option === "full") {
    deletedPanels = await purgeSetupPanels(input.guild, trackedChannelIds);
  }

  if (input.option === "channels" || input.option === "full") {
    deletedChannels = await deleteSetupChannels(input.guild, input.actorId, trackedChannelIds);
  }

  if (input.option === "roles" || input.option === "full") {
    deletedRoles = await deleteSetupRoles(input.guild, input.actorId, trackedRoleIds);
  }

  await prisma.botGuildConfig.update({
    where: { guildId: input.guild.id },
    data: {
      setupCompleted: false,
      setupMode: "Not Configured",
      ticketCategoryId: null,
      ticketPanelChannelId: null,
      logChannelId: null,
      modLogChannelId: null,
      suggestionChannelId: null,
      giveawayChannelId: null,
      announcementChannelId: null,
      welcomeChannelId: null,
      supportRoleIdsJson: "[]",
      adminRoleIdsJson: "[]",
      productRoleMapJson: "{}",
      logChannelIdsJson: "{}",
      botCreatedRoleIdsJson: input.option === "channels" || input.option === "panels" ? config.botCreatedRoleIdsJson : "[]",
      botCreatedChannelIdsJson: input.option === "roles" || input.option === "panels" ? config.botCreatedChannelIdsJson : "[]",
      setupPlanJson: "{}",
      websiteSyncStatus: "Reset",
      lastSyncedAt: null,
    },
  });

  await prisma.botLog.create({
    data: {
      guildId: input.guild.id,
      actorId: input.actorId,
      action: "reset setup wizard state",
      area: "Setup",
      severity: "Warning",
      metadataJson: toJson({ option: input.option, deletedChannels, deletedRoles, deletedPanels }),
    },
  });

  return { deletedChannels, deletedRoles, deletedPanels, configReset: true };
}
