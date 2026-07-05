import { NextResponse } from "next/server";
import { requireDiscordBot } from "@/lib/auth/bot";
import { prisma } from "@/lib/db/prisma";
import { botCustomerSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const unauthorized = requireDiscordBot(request);
  if (unauthorized) return unauthorized;

  const parsed = botCustomerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid customer sync payload." }, { status: 400 });
  }

  const email = parsed.data.email || `${parsed.data.discordId}@discord.mxf-labs.local`;
  const existing =
    (await prisma.customer.findFirst({ where: { discordId: parsed.data.discordId } })) ||
    (await prisma.customer.findUnique({ where: { email } }));

  const customer = existing
    ? await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name: parsed.data.globalName || parsed.data.username,
          email,
          discordId: parsed.data.discordId,
          discordUsername: parsed.data.username,
          discordGlobalName: parsed.data.globalName || parsed.data.username,
          discordEmail: parsed.data.email || null,
          discordAvatar: parsed.data.avatar || null,
          discordLinkedAt: existing.discordLinkedAt || new Date(),
          discordLastSyncedAt: new Date(),
          discordSyncStatus: "Bot Synced",
        },
      })
    : await prisma.customer.create({
        data: {
          name: parsed.data.globalName || parsed.data.username,
          email,
          discordId: parsed.data.discordId,
          discordUsername: parsed.data.username,
          discordGlobalName: parsed.data.globalName || parsed.data.username,
          discordEmail: parsed.data.email || null,
          discordAvatar: parsed.data.avatar || null,
          discordLinkedAt: new Date(),
          discordLastSyncedAt: new Date(),
          discordSyncStatus: "Bot Synced",
        },
      });

  return NextResponse.json({ ok: true, customer });
}
