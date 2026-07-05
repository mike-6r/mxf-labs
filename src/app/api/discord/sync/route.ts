import { NextResponse } from "next/server";
import { requireDiscordBot } from "@/lib/auth/bot";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const unauthorized = requireDiscordBot(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const [customers, licenses, products, servers, openTickets] = await Promise.all([
    prisma.customer.count({ where: { discordId: { not: null } } }),
    prisma.license.count({ where: { status: "Active" } }),
    prisma.product.count({ where: { visible: true } }),
    prisma.discordServer.count(),
    prisma.supportTicket.count({ where: { status: { notIn: ["Resolved", "Closed"] } } }),
  ]);

  await prisma.activityLog.create({
    data: {
      actorEmail: "discord-bot",
      action: "discord sync requested",
      entityType: "Discord",
      metadata: JSON.stringify({ source: body.source || "bot" }),
    },
  });

  return NextResponse.json({
    ok: true,
    syncedAt: new Date().toISOString(),
    summary: { customers, licenses, products, servers, openTickets },
  });
}
