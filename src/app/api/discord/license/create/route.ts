import { NextResponse } from "next/server";
import { requireDiscordBot } from "@/lib/auth/bot";
import { logCustomerActivity } from "@/lib/db/customer-activity";
import { prisma } from "@/lib/db/prisma";
import { generateLicenseKey } from "@/lib/license/generate";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function maskLicenseKey(key: string) {
  return key.length <= 8 ? "****" : `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function parseExpiration(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || /^(never|none|lifetime|permanent)$/i.test(normalized)) return null;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

async function uniqueLicenseKey() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const key = generateLicenseKey();
    const existing = await prisma.license.findUnique({ where: { key } });
    if (!existing) return key;
  }

  throw new Error("Unable to generate a unique license key.");
}

export async function POST(request: Request) {
  const unauthorized = requireDiscordBot(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const productInput = typeof body.productSlug === "string" ? body.productSlug.trim() : "";
  const targetDiscordId = typeof body.targetDiscordId === "string" ? body.targetDiscordId.trim() : "";
  const targetUsername = typeof body.targetUsername === "string" ? body.targetUsername.trim() : "Discord Customer";
  const staffDiscordId = typeof body.staffDiscordId === "string" ? body.staffDiscordId.trim() : "unknown";
  const staffUsername = typeof body.staffUsername === "string" ? body.staffUsername.trim() : "Discord Staff";
  const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim() : "";
  const licenseType = typeof body.licenseType === "string" ? body.licenseType.trim() : "Lifetime";
  const activationLimit = Number(body.activationLimit || body.activations || 1);
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const discordServerId = typeof body.discordServerId === "string" ? body.discordServerId.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const source = typeof body.source === "string" ? body.source : "discord_bot";
  const allowFullKey = body.allowFullKey !== false;

  if (!productInput) {
    return NextResponse.json({ ok: false, message: "Product is required." }, { status: 400 });
  }

  if (!targetDiscordId && !customerEmail) {
    return NextResponse.json({ ok: false, message: "targetDiscordId or customerEmail is required." }, { status: 400 });
  }

  if (!Number.isInteger(activationLimit) || activationLimit < 1 || activationLimit > 999) {
    return NextResponse.json({ ok: false, message: "Activation limit must be between 1 and 999." }, { status: 400 });
  }

  const expiresAt = parseExpiration(body.expiresAt);
  if (expiresAt === undefined) {
    return NextResponse.json({ ok: false, message: "Expiration must be Never or a valid date." }, { status: 400 });
  }

  const productSlug = slugify(productInput);
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ slug: productSlug }, { name: { equals: productInput } }],
    },
  });

  if (!product) {
    return NextResponse.json({ ok: false, message: "Product not found." }, { status: 404 });
  }

  const email = customerEmail || (targetDiscordId ? `${targetDiscordId}@discord.mxf-labs.local` : "");
  const existingCustomer =
    (targetDiscordId ? await prisma.customer.findFirst({ where: { discordId: targetDiscordId } }) : null) ||
    (email ? await prisma.customer.findUnique({ where: { email } }) : null);

  const customer = existingCustomer
    ? await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          name: existingCustomer.name || targetUsername,
          email: existingCustomer.email || email,
          discordId: targetDiscordId || existingCustomer.discordId,
          discordUsername: targetUsername || existingCustomer.discordUsername,
          discordLastSyncedAt: new Date(),
          discordSyncStatus: targetDiscordId ? "Discord License Synced" : existingCustomer.discordSyncStatus,
          notes: `${existingCustomer.notes || ""}\nDiscord license assignment checked by ${staffUsername} (${staffDiscordId}).`.trim(),
        },
      })
    : await prisma.customer.create({
        data: {
          name: targetUsername,
          email,
          discordId: targetDiscordId || null,
          discordUsername: targetUsername,
          discordLinkedAt: targetDiscordId ? new Date() : null,
          discordLastSyncedAt: new Date(),
          discordSyncStatus: targetDiscordId ? "Pending Account Link" : "Pending Email Link",
          notes: `Pending customer created by Discord license command. Staff: ${staffUsername} (${staffDiscordId}).`,
        },
      });

  const duplicateActiveLicense = await prisma.license.findFirst({
    where: {
      customerId: customer.id,
      productId: product.id,
      status: "Active",
    },
  });

  const license = await prisma.license.create({
    data: {
      key: await uniqueLicenseKey(),
      productId: product.id,
      customerId: customer.id,
      status: "Active",
      licenseType,
      expirationDate: expiresAt,
      minimumVersion: product.version || null,
      maxActivations: activationLimit,
      notes: [
        "Created by Discord command.",
        `Staff Discord ID: ${staffDiscordId}`,
        `Staff: ${staffUsername}`,
        reason ? `Reason: ${reason}` : "",
        orderId ? `Order ID: ${orderId}` : "",
        discordServerId ? `Discord server ID: ${discordServerId}` : "",
        notes,
      ]
        .filter(Boolean)
        .join("\n"),
    },
    include: { customer: true, product: true },
  });

  if (discordServerId) {
    await prisma.discordServer.upsert({
      where: { serverId: discordServerId },
      update: {
        linkedCustomerId: customer.id,
        linkedLicenseId: license.id,
        productId: product.id,
        lastSyncedAt: new Date(),
      },
      create: {
        serverId: discordServerId,
        serverName: `Discord Server ${discordServerId}`,
        ownerDiscordId: targetDiscordId || staffDiscordId,
        linkedCustomerId: customer.id,
        linkedLicenseId: license.id,
        productId: product.id,
        lastSyncedAt: new Date(),
      },
    });
  }

  await prisma.customerNotification.create({
    data: {
      customerId: customer.id,
      title: "License created",
      body: `${product.name} is now active in your MxF Labs account.`,
      type: "License",
    },
  });

  await logCustomerActivity({
    customerId: customer.id,
    action: "discord license created",
    entityType: "License",
    entityId: license.id,
    metadata: {
      source,
      productId: product.id,
      staffDiscordId,
      targetDiscordId,
      orderId,
      duplicateActiveLicenseId: duplicateActiveLicense?.id || null,
    },
  });

  await prisma.activityLog.create({
    data: {
      actorEmail: `discord:${staffDiscordId}`,
      action: "created license from discord",
      entityType: "License",
      entityId: license.id,
      metadata: JSON.stringify({
        source,
        guildId: body.guildId,
        staffDiscordId,
        staffUsername,
        targetDiscordId,
        targetUsername,
        customerId: customer.id,
        productSlug: product.slug,
        activationLimit,
        licenseType,
        expiration: expiresAt?.toISOString() || "Never",
        duplicateActiveLicenseId: duplicateActiveLicense?.id || null,
      }),
    },
  });

  return NextResponse.json(
    {
      ok: true,
      success: true,
      licenseId: license.id,
      maskedLicenseKey: maskLicenseKey(license.key),
      fullLicenseKey: allowFullKey ? license.key : undefined,
      customerId: customer.id,
      customerEmail: customer.email,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        version: product.version,
        documentationLink: product.documentationLink,
        supportLink: product.supportLink,
        defaultActivationLimit: product.defaultActivationLimit,
      },
      status: license.status,
      licenseType: license.licenseType,
      activationLimit: license.maxActivations,
      expiresAt: license.expirationDate?.toISOString() || null,
      roleSyncResult: "pending_discord_role_sync",
      duplicateWarning: duplicateActiveLicense ? "Customer already has an active license for this product." : null,
      portalUrl: "/portal/licenses",
    },
    { status: 201 },
  );
}
