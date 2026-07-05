import {
  AttachmentBuilder,
  ChannelType,
  PermissionFlagsBits,
  type CategoryChannel,
  type Guild,
  type OverwriteResolvable,
  type TextChannel,
  type User,
} from "discord.js";
import type { BotGuildConfig, BotTicket } from "@prisma/client";
import { prisma } from "../services/prisma";
import { queueWebsiteEvent } from "../services/sync-queue";
import type { WebsiteApiClient } from "../services/website-api";
import { keyValueFields, linkAccountComponent, mxfEmbed, statusEmbed, ticketControlComponents } from "../utils/embeds";
import { parseJson, toJson } from "../utils/json";
import { getOwnership, validateLicense } from "./licensing";

export type TicketTypeKey = "general" | "product" | "license" | "purchase" | "bug" | "custom";
export type TicketPriority = "Low" | "Normal" | "High" | "Urgent";

const STAFF_TICKET_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.ManageMessages,
];

const CUSTOMER_TICKET_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.EmbedLinks,
];

async function nextTicketNumber(guildId: string) {
  const count = await prisma.botTicket.count({ where: { guildId } });
  const base = count + 1;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = `MXF-TKT-${String(base + attempt).padStart(4, "0")}`;
    const existing = await prisma.botTicket.findUnique({ where: { ticketNumber: candidate } });
    if (!existing) return candidate;
  }

  return `MXF-TKT-${Date.now()}`;
}

export function ticketTypeFromKey(key: string | null | undefined) {
  switch (key) {
    case "product":
      return "Product Support";
    case "license":
      return "License Support";
    case "purchase":
      return "Purchase Support";
    case "bug":
      return "Bug Report";
    case "custom":
      return "Custom Order";
    default:
      return "General Support";
  }
}

function ticketKeyFromType(type: string | null | undefined): TicketTypeKey {
  const normalized = (type || "").toLowerCase();
  if (normalized.includes("product")) return "product";
  if (normalized.includes("license")) return "license";
  if (normalized.includes("purchase") || normalized.includes("billing") || normalized.includes("payment")) return "purchase";
  if (normalized.includes("bug")) return "bug";
  if (normalized.includes("custom")) return "custom";
  return "general";
}

export function ticketChannelPrefix(type: string | null | undefined) {
  switch (ticketKeyFromType(type)) {
    case "license":
      return "license";
    case "purchase":
      return "purchase";
    case "product":
      return "product";
    case "bug":
      return "bug";
    case "custom":
      return "custom";
    default:
      return "ticket";
  }
}

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

export function safeTicketChannelName(prefix: string, username: string, ticketNumber?: string) {
  const handle = slugPart(username) || "customer";
  const suffix = ticketNumber ? `-${ticketNumber.replace(/^MXF-TKT-/i, "").toLowerCase()}` : "";
  return `${prefix}-${handle}${suffix}`.slice(0, 90);
}

export function maskLicenseKey(key?: string | null) {
  if (!key) return "Not provided";
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "****";
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

function ticketStaffRoleIds(config: Pick<BotGuildConfig, "supportRoleIdsJson" | "adminRoleIdsJson">) {
  return [
    ...new Set([
      ...parseJson<string[]>(config.supportRoleIdsJson, []),
      ...parseJson<string[]>(config.adminRoleIdsJson, []),
    ]),
  ].filter(Boolean);
}

function ticketLogChannelIds(config: Pick<BotGuildConfig, "logChannelIdsJson" | "logChannelId">) {
  const logChannels = parseJson<Record<string, string>>(config.logChannelIdsJson, {});
  return [logChannels.ticket, logChannels.support, config.logChannelId].filter(Boolean) as string[];
}

function ticketPermissionOverwrites(guild: Guild, requesterId: string, staffRoleIds: string[]): OverwriteResolvable[] {
  const botId = guild.members.me?.id || guild.client.user?.id;
  const overwrites: OverwriteResolvable[] = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: requesterId, allow: CUSTOMER_TICKET_PERMISSIONS },
    ...staffRoleIds.map((id) => ({ id, allow: STAFF_TICKET_PERMISSIONS })),
  ];

  if (botId) {
    overwrites.push({
      id: botId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  return overwrites;
}

function ticketCategoryOverwrites(guild: Guild, staffRoleIds: string[]): OverwriteResolvable[] {
  const botId = guild.members.me?.id || guild.client.user?.id;
  const overwrites: OverwriteResolvable[] = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    ...staffRoleIds.map((id) => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] })),
  ];

  if (botId) {
    overwrites.push({
      id: botId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels],
    });
  }

  return overwrites;
}

async function ensureTicketCategory(guild: Guild, config: BotGuildConfig, staffRoleIds: string[]) {
  const existing = config.ticketCategoryId ? await guild.channels.fetch(config.ticketCategoryId).catch(() => null) : null;
  if (existing?.type === ChannelType.GuildCategory) return existing as CategoryChannel;

  const ticketConfig = parseJson<Record<string, unknown>>(config.ticketConfigJson, {});
  if (ticketConfig.autoRepairTicketCategory === false) return null;

  const reusable = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildCategory &&
      ["🎫 mxf tickets", "mxf tickets"].includes(channel.name.toLowerCase()),
  ) as CategoryChannel | undefined;

  const category =
    reusable ||
    ((await guild.channels.create({
      name: "🎫 MXF TICKETS",
      type: ChannelType.GuildCategory,
      permissionOverwrites: ticketCategoryOverwrites(guild, staffRoleIds),
      reason: "MxF Labs ticket category auto-repair",
    })) as CategoryChannel);

  await prisma.botGuildConfig.update({
    where: { guildId: guild.id },
    data: { ticketCategoryId: category.id },
  }).catch(() => null);

  return category;
}

async function fetchTextChannel(guild: Guild, channelId?: string | null) {
  if (!channelId) return null;
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  return channel?.type === ChannelType.GuildText ? (channel as TextChannel) : null;
}

async function sendTicketLog(input: {
  guild: Guild;
  config: BotGuildConfig;
  title: string;
  description: string;
  state?: "ok" | "warn" | "error";
  ticket?: Pick<BotTicket, "id" | "ticketNumber" | "type" | "priority" | "status">;
  actorId?: string;
  files?: AttachmentBuilder[];
}) {
  const embed = statusEmbed(input.title, input.description, input.state || "ok");
  if (input.ticket) {
    embed.addFields(
      keyValueFields({
        Ticket: input.ticket.ticketNumber,
        Type: input.ticket.type,
        Priority: input.ticket.priority,
        Status: input.ticket.status,
      }),
    );
  }
  if (input.actorId) embed.addFields({ name: "Actor", value: `<@${input.actorId}>`, inline: true });

  for (const channelId of ticketLogChannelIds(input.config)) {
    const channel = await fetchTextChannel(input.guild, channelId);
    if (channel) {
      await channel.send({ embeds: [embed], files: input.files }).catch(() => null);
      return;
    }
  }
}

export async function createTicket(input: {
  website?: WebsiteApiClient;
  guildId: string;
  channelId?: string;
  requesterId: string;
  requesterName?: string;
  requesterEmail?: string;
  requesterDiscord?: string;
  type?: string;
  priority?: string;
  subject?: string;
  message?: string;
  productSlug?: string;
  licenseKey?: string;
}) {
  let websiteTicket: Awaited<ReturnType<WebsiteApiClient["createSupportTicket"]>> | null = null;

  if (input.website && (input.requesterEmail || input.requesterId)) {
    websiteTicket = await input.website.createSupportTicket({
      name: input.requesterName || input.requesterDiscord || input.requesterId,
      email: input.requesterEmail || "",
      discordUsername: input.requesterDiscord,
      discordId: input.requesterId,
      priority: input.priority || "Normal",
      subject: input.subject || input.type || "Discord support request",
      message: input.message || "Created from the MxF Labs Discord bot.",
      type: input.type,
      productSlug: input.productSlug,
      licenseKey: input.licenseKey,
    });

    if (!websiteTicket.ok) {
      await queueWebsiteEvent({
        guildId: input.guildId,
        eventType: "discord.ticket_create",
        payload: {
          requesterId: input.requesterId,
          requesterEmail: input.requesterEmail,
          type: input.type,
          subject: input.subject,
          productSlug: input.productSlug,
          queuedBecause: websiteTicket.message,
        },
      });
    }
  }

  return prisma.botTicket.create({
    data: {
      ticketNumber: await nextTicketNumber(input.guildId),
      guildId: input.guildId,
      channelId: input.channelId,
      requesterId: input.requesterId,
      customerDiscordId: input.requesterId,
      websiteTicketId: websiteTicket?.ok ? websiteTicket.data.ticketNumber || null : null,
      productSlug: input.productSlug,
      licenseKey: input.licenseKey,
      type: input.type || "General Support",
      priority: input.priority || "Normal",
      subject: input.subject || "Discord support request",
      status: "Open",
      messages: {
        create: {
          authorId: input.requesterId,
          content: input.message || "Created from the MxF Labs Discord bot.",
          attachmentJson: "[]",
        },
      },
    },
  });
}

export async function createDiscordTicket(input: {
  guild: Guild;
  website: WebsiteApiClient;
  requester: User;
  type?: string;
  priority?: TicketPriority | string;
  subject?: string;
  message?: string;
  productSlug?: string;
  productVersion?: string;
  licenseKey?: string;
  orderEmail?: string;
  paymentProvider?: string;
}) {
  const config = await prisma.botGuildConfig.findUnique({ where: { guildId: input.guild.id } });
  if (!config) {
    return {
      ok: false as const,
      message: "Setup configuration is missing. Run /setup apply first.",
    };
  }

  const staffIds = ticketStaffRoleIds(config);
  const category = await ensureTicketCategory(input.guild, config, staffIds);
  if (!category) {
    return {
      ok: false as const,
      message: "The saved ticket category no longer exists. Run /setup repair all to rebuild it.",
    };
  }

  if (!staffIds.length) {
    await queueWebsiteEvent({
      guildId: input.guild.id,
      eventType: "discord.ticket_warning",
      payload: { warning: "no_support_roles", requesterId: input.requester.id },
    });
  }

  const type = input.type || "General Support";
  const ticket = await createTicket({
    website: input.website,
    guildId: input.guild.id,
    requesterId: input.requester.id,
    requesterName: input.requester.globalName || input.requester.username,
    requesterDiscord: input.requester.tag,
    type,
    priority: input.priority || "Normal",
    subject: input.subject || `${ticketKeyFromType(type)} support request`,
    message: input.message || "Created from the MxF Labs Discord ticket panel.",
    productSlug: input.productSlug,
    licenseKey: input.licenseKey,
  });

  let channel: TextChannel;
  try {
    channel = (await input.guild.channels.create({
      name: safeTicketChannelName(ticketChannelPrefix(type), input.requester.username, ticket.ticketNumber),
      type: ChannelType.GuildText,
      parent: category.id,
      topic: `${ticket.ticketNumber} / ${type} / ${input.requester.tag}`,
      permissionOverwrites: ticketPermissionOverwrites(input.guild, input.requester.id, staffIds),
      reason: `MxF Labs ticket opened by ${input.requester.tag}`,
    })) as TextChannel;
  } catch (error) {
    await prisma.botLog.create({
      data: {
        guildId: input.guild.id,
        actorId: input.requester.id,
        action: "failed to create ticket channel",
        area: "Tickets",
        severity: "Error",
        targetId: ticket.id,
        metadataJson: toJson({ ticketNumber: ticket.ticketNumber, error: error instanceof Error ? error.message : "Unknown error" }),
      },
    });
    return {
      ok: false as const,
      message: "I could not create the private ticket channel. Check Manage Channels permission and bot role position.",
    };
  }

  const updatedTicket = await prisma.botTicket.update({
    where: { id: ticket.id },
    data: { channelId: channel.id },
  });

  const [ownership, warningCount] = await Promise.all([
    getOwnership(input.website, input.requester.id).catch(() => null),
    prisma.botWarning.count({ where: { guildId: input.guild.id, userId: input.requester.id, active: true } }),
  ]);
  const customerId = ownership?.customer?.id || null;
  const suspiciousCount = customerId
    ? await prisma.suspiciousActivityFlag.count({ where: { customerId, status: "Open" } }).catch(() => 0)
    : 0;
  const licenseLookup =
    input.licenseKey
      ? await validateLicense(input.website, {
          key: input.licenseKey,
          productSlug: input.productSlug,
          discordId: input.requester.id,
        }).catch(() => null)
      : null;

  const embed = mxfEmbed({
    title: `${updatedTicket.ticketNumber} / ${type}`,
    description: "A private MxF Labs support channel is open. Staff can claim, route, transcript, and close this ticket from the controls below.",
  }).addFields(
    keyValueFields({
      "Opened By": `${input.requester.tag}`,
      "Customer Discord": `<@${input.requester.id}>`,
      "Product": input.productSlug || "Not specified",
      "Version": input.productVersion || "Not specified",
      "License": maskLicenseKey(input.licenseKey),
      "License Status": licenseLookup?.ok ? (licenseLookup.data.valid ? "Valid" : licenseLookup.data.reason) : input.licenseKey ? "Lookup unavailable" : "Not provided",
      "Priority": updatedTicket.priority,
      "Ownership": ownership?.customer ? `${ownership.products.length} products / ${ownership.licenses.length} licenses` : "Account not linked",
      "Flags": suspiciousCount || warningCount ? `${suspiciousCount} suspicious / ${warningCount} warnings` : "Clear",
    }),
  );

  if (input.orderEmail || input.paymentProvider) {
    embed.addFields(
      keyValueFields({
        "Order Email": input.orderEmail || "Not provided",
        "Payment Provider": input.paymentProvider || "Not provided",
      }),
    );
  }

  embed.addFields({
    name: "Staff Instructions",
    value: "Claim the ticket, verify ownership/licensing context, keep sensitive keys masked, then close with a reason so a transcript is generated.",
  });

  const controls = ownership?.customer ? ticketControlComponents(updatedTicket.id) : [...ticketControlComponents(updatedTicket.id), ...linkAccountComponent()];
  const supportMention = staffIds[0] ? `<@&${staffIds[0]}>` : undefined;
  await channel.send({
    content: supportMention,
    embeds: [embed],
    components: controls,
  });

  await prisma.botLog.create({
    data: {
      guildId: input.guild.id,
      actorId: input.requester.id,
      action: "created private ticket channel",
      area: "Tickets",
      targetId: updatedTicket.id,
      metadataJson: toJson({ ticketNumber: updatedTicket.ticketNumber, channelId: channel.id, type, websiteTicketId: updatedTicket.websiteTicketId }),
    },
  });

  await sendTicketLog({
    guild: input.guild,
    config,
    title: "Ticket Created",
    description: `${updatedTicket.ticketNumber} opened in <#${channel.id}> by <@${input.requester.id}>.`,
    ticket: updatedTicket,
    actorId: input.requester.id,
  });

  await queueWebsiteEvent({
    guildId: input.guild.id,
    eventType: "discord.ticket_channel_created",
    payload: { ticketId: updatedTicket.id, ticketNumber: updatedTicket.ticketNumber, channelId: channel.id },
  });

  return { ok: true as const, ticket: updatedTicket, channel };
}

export async function ticketTranscriptBody(guild: Guild | null, ticket: Pick<BotTicket, "id" | "channelId" | "ticketNumber">) {
  if (guild && ticket.channelId) {
    const channel = await fetchTextChannel(guild, ticket.channelId);
    if (channel) {
      const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
      if (messages?.size) {
        return [...messages.values()]
          .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
          .map((message) => {
            const author = message.author?.tag || message.author?.id || "Unknown";
            const attachments = message.attachments.size ? ` [attachments: ${message.attachments.map((attachment) => attachment.url).join(", ")}]` : "";
            return `[${message.createdAt.toISOString()}] ${author}: ${message.cleanContent || "[embed/component/system message]"}${attachments}`;
          })
          .join("\n");
      }
    }
  }

  const messages = await prisma.botTicketMessage.findMany({ where: { ticketId: ticket.id }, orderBy: { createdAt: "asc" } });
  return messages
    .map((message) => `[${message.createdAt.toISOString()}] ${message.authorId}: ${message.content}`)
    .join("\n") || `${ticket.ticketNumber} had no captured messages.`;
}

export async function closeTicket(input: { ticketId: string; closedById: string; reason?: string; transcriptBody?: string }) {
  const ticket = await prisma.botTicket.update({
    where: { id: input.ticketId },
    data: {
      status: "Closed",
      closeReason: input.reason || "Closed by staff.",
      closedAt: new Date(),
    },
    include: { messages: true },
  });

  const body =
    input.transcriptBody ||
    ticket.messages
      .map((message) => `[${message.createdAt.toISOString()}] ${message.authorId}: ${message.content}`)
      .join("\n");

  await prisma.botTicketTranscript.create({
    data: {
      ticketId: ticket.id,
      generatedBy: input.closedById,
      storageKey: `bot-transcripts/${ticket.ticketNumber}.txt`,
      body,
    },
  });

  await prisma.botLog.create({
    data: {
      guildId: ticket.guildId,
      actorId: input.closedById,
      action: "closed ticket",
      area: "Tickets",
      targetId: ticket.id,
      metadataJson: toJson({ ticketNumber: ticket.ticketNumber, reason: input.reason }),
    },
  });

  return ticket;
}

export async function closeDiscordTicket(input: { guild: Guild; ticketId: string; closedById: string; reason?: string }) {
  const existing = await prisma.botTicket.findUnique({ where: { id: input.ticketId } });
  if (!existing) return { ok: false as const, message: "Ticket not found." };

  const config = await prisma.botGuildConfig.findUnique({ where: { guildId: input.guild.id } });
  const transcriptBody = await ticketTranscriptBody(input.guild, existing);
  const ticket = await closeTicket({
    ticketId: existing.id,
    closedById: input.closedById,
    reason: input.reason,
    transcriptBody,
  });
  const transcriptFile = new AttachmentBuilder(Buffer.from(transcriptBody, "utf8"), {
    name: `${ticket.ticketNumber}.txt`,
  });

  const channel = await fetchTextChannel(input.guild, ticket.channelId);
  if (channel) {
    await channel.send({
      embeds: [statusEmbed("Ticket Closed", input.reason || "Closed by staff.")],
    }).catch(() => null);
    await channel.permissionOverwrites.edit(ticket.requesterId, { SendMessages: false }).catch(() => null);
    if (!channel.name.startsWith("closed-")) {
      await channel.setName(`closed-${channel.name}`.slice(0, 90), "MxF Labs ticket closed").catch(() => null);
    }
  }

  if (config) {
    await sendTicketLog({
      guild: input.guild,
      config,
      title: "Ticket Closed",
      description: `${ticket.ticketNumber} was closed. Transcript attached when log permissions allow.`,
      ticket,
      actorId: input.closedById,
      files: [transcriptFile],
    });
  }

  const requester = await input.guild.client.users.fetch(ticket.requesterId).catch(() => null);
  await requester?.send({
    embeds: [statusEmbed("MxF Labs Ticket Closed", `${ticket.ticketNumber} was closed. Reason: ${input.reason || "Closed by staff."}`)],
    files: [new AttachmentBuilder(Buffer.from(transcriptBody, "utf8"), { name: `${ticket.ticketNumber}.txt` })],
  }).catch(() => null);

  await queueWebsiteEvent({
    guildId: input.guild.id,
    eventType: "discord.ticket_closed",
    payload: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, reason: input.reason, closedById: input.closedById },
  });

  return { ok: true as const, ticket, transcriptBody };
}

export async function claimTicket(input: { guild: Guild; ticketId: string; staffId: string }) {
  const ticket = await prisma.botTicket.update({
    where: { id: input.ticketId },
    data: { assignedStaffId: input.staffId, status: "In Progress" },
  });
  const channel = await fetchTextChannel(input.guild, ticket.channelId);
  await channel?.send({ embeds: [statusEmbed("Ticket Claimed", `<@${input.staffId}> is now handling this ticket.`)] }).catch(() => null);
  await prisma.botLog.create({
    data: {
      guildId: input.guild.id,
      actorId: input.staffId,
      action: "claimed ticket",
      area: "Tickets",
      targetId: ticket.id,
      metadataJson: toJson({ ticketNumber: ticket.ticketNumber }),
    },
  });
  return ticket;
}

export async function assignTicket(input: { guild: Guild; ticketId: string; staffId: string; actorId: string }) {
  const ticket = await prisma.botTicket.update({
    where: { id: input.ticketId },
    data: { assignedStaffId: input.staffId, status: "In Progress" },
  });
  const channel = await fetchTextChannel(input.guild, ticket.channelId);
  await channel?.send({ embeds: [statusEmbed("Ticket Assigned", `<@${input.staffId}> has been assigned to this ticket.`)] }).catch(() => null);
  await prisma.botLog.create({
    data: {
      guildId: input.guild.id,
      actorId: input.actorId,
      action: "assigned ticket",
      area: "Tickets",
      targetId: ticket.id,
      metadataJson: toJson({ ticketNumber: ticket.ticketNumber, staffId: input.staffId }),
    },
  });
  return ticket;
}

export async function setTicketPriority(input: { guild: Guild; ticketId: string; priority: TicketPriority | string; actorId: string }) {
  const ticket = await prisma.botTicket.update({
    where: { id: input.ticketId },
    data: { priority: input.priority },
  });
  const channel = await fetchTextChannel(input.guild, ticket.channelId);
  await channel?.send({ embeds: [statusEmbed("Priority Updated", `${ticket.ticketNumber} priority is now ${ticket.priority}.`)] }).catch(() => null);
  await prisma.botLog.create({
    data: {
      guildId: input.guild.id,
      actorId: input.actorId,
      action: "updated ticket priority",
      area: "Tickets",
      targetId: ticket.id,
      metadataJson: toJson({ ticketNumber: ticket.ticketNumber, priority: ticket.priority }),
    },
  });
  return ticket;
}

export function escalateTicket(input: { guild: Guild; ticketId: string; actorId: string }) {
  return setTicketPriority({ ...input, priority: "Urgent" });
}

export async function renameTicketChannel(input: { guild: Guild; ticketId: string; subject: string; actorId: string }) {
  const ticket = await prisma.botTicket.update({
    where: { id: input.ticketId },
    data: { subject: input.subject },
  });
  const channel = await fetchTextChannel(input.guild, ticket.channelId);
  if (channel) {
    const nextName = `${ticketChannelPrefix(ticket.type)}-${slugPart(input.subject) || "ticket"}`.slice(0, 90);
    await channel.setName(nextName, "MxF Labs ticket renamed").catch(() => null);
  }
  await prisma.botLog.create({
    data: {
      guildId: input.guild.id,
      actorId: input.actorId,
      action: "renamed ticket",
      area: "Tickets",
      targetId: ticket.id,
      metadataJson: toJson({ ticketNumber: ticket.ticketNumber, subject: ticket.subject }),
    },
  });
  return ticket;
}

export async function addTicketParticipant(input: { guild: Guild; ticketId: string; userId: string; actorId: string }) {
  const ticket = await prisma.botTicket.findUnique({ where: { id: input.ticketId } });
  if (!ticket) return { ok: false as const, message: "Ticket not found." };
  const channel = await fetchTextChannel(input.guild, ticket.channelId);
  if (!channel) return { ok: false as const, message: "Ticket channel not found." };
  await channel.permissionOverwrites.edit(input.userId, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true, AttachFiles: true }).catch(() => null);
  await addTicketMessage({ ticketId: ticket.id, authorId: input.actorId, content: `Added <@${input.userId}> to the ticket.`, internal: true });
  await channel.send({ embeds: [statusEmbed("Participant Added", `<@${input.userId}> can now view this ticket.`)] }).catch(() => null);
  return { ok: true as const, ticket };
}

export async function removeTicketParticipant(input: { guild: Guild; ticketId: string; userId: string; actorId: string }) {
  const ticket = await prisma.botTicket.findUnique({ where: { id: input.ticketId } });
  if (!ticket) return { ok: false as const, message: "Ticket not found." };
  const channel = await fetchTextChannel(input.guild, ticket.channelId);
  if (!channel) return { ok: false as const, message: "Ticket channel not found." };
  await channel.permissionOverwrites.edit(input.userId, { ViewChannel: false, SendMessages: false }).catch(() => null);
  await addTicketMessage({ ticketId: ticket.id, authorId: input.actorId, content: `Removed <@${input.userId}> from the ticket.`, internal: true });
  await channel.send({ embeds: [statusEmbed("Participant Removed", `<@${input.userId}> can no longer view this ticket.`)] }).catch(() => null);
  return { ok: true as const, ticket };
}

export async function generateTicketTranscript(input: { guild: Guild; ticketId: string; actorId: string }) {
  const ticket = await prisma.botTicket.findUnique({ where: { id: input.ticketId } });
  if (!ticket) return { ok: false as const, message: "Ticket not found." };
  const body = await ticketTranscriptBody(input.guild, ticket);
  const transcript = await prisma.botTicketTranscript.create({
    data: {
      ticketId: ticket.id,
      generatedBy: input.actorId,
      storageKey: `bot-transcripts/${ticket.ticketNumber}-${Date.now()}.txt`,
      body,
    },
  });
  await prisma.botLog.create({
    data: {
      guildId: input.guild.id,
      actorId: input.actorId,
      action: "generated ticket transcript",
      area: "Tickets",
      targetId: ticket.id,
      metadataJson: toJson({ ticketNumber: ticket.ticketNumber, transcriptId: transcript.id }),
    },
  });
  return {
    ok: true as const,
    ticket,
    transcript,
    body,
    file: new AttachmentBuilder(Buffer.from(body, "utf8"), { name: `${ticket.ticketNumber}.txt` }),
  };
}

export function listOpenTickets(guildId: string) {
  return prisma.botTicket.findMany({
    where: { guildId, status: { not: "Closed" } },
    orderBy: [{ priority: "desc" }, { openedAt: "desc" }],
    take: 15,
  });
}

export function addTicketMessage(input: { ticketId: string; authorId: string; content: string; internal?: boolean }) {
  return prisma.botTicketMessage.create({
    data: {
      ticketId: input.ticketId,
      authorId: input.authorId,
      content: input.content,
      internal: input.internal || false,
    },
  });
}

export function ticketByInput(guildId: string, ticketNumber?: string | null, channelId?: string | null) {
  return prisma.botTicket.findFirst({
    where: {
      guildId,
      ...(ticketNumber ? { ticketNumber } : channelId ? { channelId } : {}),
    },
    orderBy: { openedAt: "desc" },
  });
}
