import { NextResponse } from "next/server";
import { requireDiscordBot } from "@/lib/auth/bot";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const unauthorized = requireDiscordBot(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const guildId = typeof body.guildId === "string" ? body.guildId.trim() : "";
  const guildName = typeof body.guildName === "string" ? body.guildName.trim() : "";
  const ownerId = typeof body.ownerId === "string" ? body.ownerId.trim() : "";

  if (!guildId || !guildName || !ownerId) {
    return NextResponse.json({ ok: false, message: "guildId, guildName, and ownerId are required." }, { status: 400 });
  }

  const server = await prisma.discordServer.upsert({
    where: { serverId: guildId },
    update: {
      serverName: guildName,
      ownerDiscordId: ownerId,
      lastSyncedAt: new Date(),
    },
    create: {
      serverId: guildId,
      serverName: guildName,
      ownerDiscordId: ownerId,
      lastSyncedAt: new Date(),
    },
  });

  await prisma.botGuildConfig.upsert({
    where: { guildId },
    update: {
      guildName,
      setupMode: typeof body.setupMode === "string" ? body.setupMode : "standard",
      ownerId,
      setupCompleted: true,
      ticketCategoryId: typeof body.ticketCategoryId === "string" ? body.ticketCategoryId : null,
      ticketPanelChannelId: typeof body.ticketPanelChannelId === "string" ? body.ticketPanelChannelId : null,
      logChannelIdsJson: JSON.stringify(body.logChannelIds || {}),
      productRoleMapJson: JSON.stringify(body.productRoleIds || {}),
      supportRoleIdsJson: JSON.stringify(body.supportRoleIds || []),
      websiteSyncStatus: "Synced",
      lastSyncedAt: new Date(),
    },
    create: {
      guildId,
      guildName,
      setupMode: typeof body.setupMode === "string" ? body.setupMode : "standard",
      ownerId,
      setupCompleted: true,
      ticketCategoryId: typeof body.ticketCategoryId === "string" ? body.ticketCategoryId : null,
      ticketPanelChannelId: typeof body.ticketPanelChannelId === "string" ? body.ticketPanelChannelId : null,
      logChannelIdsJson: JSON.stringify(body.logChannelIds || {}),
      productRoleMapJson: JSON.stringify(body.productRoleIds || {}),
      supportRoleIdsJson: JSON.stringify(body.supportRoleIds || []),
      websiteSyncStatus: "Synced",
      lastSyncedAt: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      actorEmail: "discord-bot",
      action: "discord setup synced",
      entityType: "DiscordServer",
      entityId: server.id,
      metadata: JSON.stringify({
        setupMode: body.setupMode,
        createdRoles: Array.isArray(body.createdRoles) ? body.createdRoles.length : 0,
        createdChannels: Array.isArray(body.createdChannels) ? body.createdChannels.length : 0,
      }),
    },
  });

  return NextResponse.json({ ok: true, message: "Discord setup synced.", server });
}
