import { NextResponse } from "next/server";
import { requireDiscordBot } from "@/lib/auth/bot";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const unauthorized = requireDiscordBot(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const heartbeat = await prisma.botHeartbeat.create({
    data: {
      botId: typeof body.botId === "string" ? body.botId : "mxf-labs-bot",
      status: typeof body.status === "string" ? body.status : "Unknown",
      guildCount: Number.isFinite(Number(body.guildCount)) ? Number(body.guildCount) : 0,
      commandCount: Number.isFinite(Number(body.commandCount)) ? Number(body.commandCount) : 0,
      latencyMs: Number.isFinite(Number(body.latencyMs)) ? Number(body.latencyMs) : 0,
      websiteApiStatus: typeof body.websiteApiStatus === "string" ? body.websiteApiStatus : "Unknown",
      licenseApiStatus: typeof body.licenseApiStatus === "string" ? body.licenseApiStatus : "Unknown",
      lastSyncAt: typeof body.lastSyncAt === "string" ? new Date(body.lastSyncAt) : null,
      version: typeof body.version === "string" ? body.version : null,
      metadataJson: JSON.stringify(body.metadata || {}),
    },
  });

  return NextResponse.json({ ok: true, heartbeatId: heartbeat.id });
}
