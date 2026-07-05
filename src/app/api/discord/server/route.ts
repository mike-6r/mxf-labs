import { NextResponse } from "next/server";
import { requireDiscordBot } from "@/lib/auth/bot";
import { prisma } from "@/lib/db/prisma";
import { botServerSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const unauthorized = requireDiscordBot(request);
  if (unauthorized) return unauthorized;

  const parsed = botServerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid server payload." }, { status: 400 });
  }

  const [customer, license, product] = await Promise.all([
    parsed.data.customerDiscordId
      ? prisma.customer.findFirst({ where: { discordId: parsed.data.customerDiscordId } })
      : null,
    parsed.data.licenseKey ? prisma.license.findUnique({ where: { key: parsed.data.licenseKey } }) : null,
    parsed.data.productSlug ? prisma.product.findUnique({ where: { slug: parsed.data.productSlug } }) : null,
  ]);

  const server = await prisma.discordServer.upsert({
    where: { serverId: parsed.data.serverId },
    update: {
      serverName: parsed.data.serverName,
      ownerDiscordId: parsed.data.ownerDiscordId,
      linkedCustomerId: customer?.id || null,
      linkedLicenseId: license?.id || null,
      productId: product?.id || null,
      lastSyncedAt: new Date(),
    },
    create: {
      serverId: parsed.data.serverId,
      serverName: parsed.data.serverName,
      ownerDiscordId: parsed.data.ownerDiscordId,
      linkedCustomerId: customer?.id || null,
      linkedLicenseId: license?.id || null,
      productId: product?.id || null,
      lastSyncedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, server });
}
