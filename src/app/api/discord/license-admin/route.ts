import { NextResponse } from "next/server";
import { requireDiscordBot } from "@/lib/auth/bot";
import { prisma } from "@/lib/db/prisma";

const allowedActions = new Set(["lookup", "revoke", "suspend", "reset-hwid", "reset-ip", "activations", "flags", "sync", "transfer", "extend", "note"]);

function parseExpiration(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (!normalized || /^(never|none|lifetime|permanent)$/i.test(normalized)) return null;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function POST(request: Request) {
  const unauthorized = requireDiscordBot(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "";
  const key = typeof body.key === "string" ? body.key.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "Discord bot staff action";

  if (!allowedActions.has(action)) {
    return NextResponse.json({ ok: false, message: "Unsupported license action." }, { status: 400 });
  }

  if (!key) {
    return NextResponse.json({ ok: false, message: "License key is required." }, { status: 400 });
  }

  const license = await prisma.license.findUnique({
    where: { key },
    include: { product: true, customer: true, activations: true, suspiciousFlags: true },
  });

  if (!license) {
    return NextResponse.json({ ok: false, message: "License not found." }, { status: 404 });
  }

  if (action === "revoke" || action === "suspend") {
    const updated = await prisma.license.update({
      where: { id: license.id },
      data: {
        status: action === "revoke" ? "Revoked" : "Suspended",
        blacklisted: action === "revoke",
        blacklistedAt: action === "revoke" ? new Date() : license.blacklistedAt,
        notes: `${license.notes}\nDiscord bot ${action}: ${reason}`.trim(),
      },
      include: { product: true, customer: true },
    });

    await prisma.activityLog.create({
      data: {
        actorEmail: "discord-bot",
        action: `license ${action}`,
        entityType: "License",
        entityId: license.id,
        metadata: JSON.stringify({ key, reason }),
      },
    });

    return NextResponse.json({ ok: true, message: `License ${action} complete.`, license: updated });
  }

  if (action === "reset-hwid") {
    await prisma.licenseActivation.deleteMany({ where: { licenseId: license.id } });
    await prisma.license.update({ where: { id: license.id }, data: { currentActivations: 0, resetCount: { increment: 1 }, lastResetAt: new Date() } });
    return NextResponse.json({ ok: true, message: "License activations reset." });
  }

  if (action === "reset-ip") {
    await prisma.licenseActivation.updateMany({ where: { licenseId: license.id }, data: { ipAddress: null } });
    await prisma.license.update({ where: { id: license.id }, data: { resetCount: { increment: 1 }, lastResetAt: new Date() } });
    return NextResponse.json({ ok: true, message: "License IP bindings cleared." });
  }

  if (action === "activations") {
    return NextResponse.json({ ok: true, message: "License activations loaded.", activations: license.activations });
  }

  if (action === "flags") {
    return NextResponse.json({ ok: true, message: "License flags loaded.", flags: license.suspiciousFlags });
  }

  if (action === "transfer") {
    const targetDiscordId = typeof body.targetDiscordId === "string" ? body.targetDiscordId.trim() : "";
    const targetUsername = typeof body.targetUsername === "string" ? body.targetUsername.trim() : "Discord Customer";
    const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim() : "";

    if (!targetDiscordId && !customerEmail) {
      return NextResponse.json({ ok: false, message: "targetDiscordId or customerEmail is required for transfer." }, { status: 400 });
    }

    const email = customerEmail || `${targetDiscordId}@discord.mxf-labs.local`;
    const existingCustomer =
      (targetDiscordId ? await prisma.customer.findFirst({ where: { discordId: targetDiscordId } }) : null) ||
      (email ? await prisma.customer.findUnique({ where: { email } }) : null);
    const customer = existingCustomer
      ? await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            discordId: targetDiscordId || existingCustomer.discordId,
            discordUsername: targetUsername || existingCustomer.discordUsername,
            discordLastSyncedAt: new Date(),
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
            discordSyncStatus: "Pending Account Link",
            notes: "Created by Discord license transfer.",
          },
        });

    const updated = await prisma.license.update({
      where: { id: license.id },
      data: {
        customerId: customer.id,
        transferCount: { increment: 1 },
        lastTransferredAt: new Date(),
        notes: `${license.notes}\nDiscord bot transfer: ${reason}`.trim(),
      },
      include: { product: true, customer: true },
    });

    await prisma.activityLog.create({
      data: {
        actorEmail: "discord-bot",
        action: "license transfer",
        entityType: "License",
        entityId: license.id,
        metadata: JSON.stringify({ key, reason, targetDiscordId, customerId: customer.id }),
      },
    });

    return NextResponse.json({ ok: true, message: "License transferred.", license: updated });
  }

  if (action === "extend") {
    const expiresAt = parseExpiration(body.expiresAt);
    if (expiresAt === undefined) {
      return NextResponse.json({ ok: false, message: "expiresAt must be Never or a valid date." }, { status: 400 });
    }

    const updated = await prisma.license.update({
      where: { id: license.id },
      data: {
        expirationDate: expiresAt,
        status: license.status === "Expired" ? "Active" : license.status,
        notes: `${license.notes}\nDiscord bot extension: ${expiresAt ? expiresAt.toISOString() : "Never"} / ${reason}`.trim(),
      },
      include: { product: true, customer: true },
    });

    await prisma.activityLog.create({
      data: {
        actorEmail: "discord-bot",
        action: "license extend",
        entityType: "License",
        entityId: license.id,
        metadata: JSON.stringify({ key, reason, expiresAt: expiresAt?.toISOString() || "Never" }),
      },
    });

    return NextResponse.json({ ok: true, message: "License expiration updated.", license: updated });
  }

  if (action === "note") {
    const note = typeof body.notes === "string" ? body.notes.trim() : "";
    if (!note) {
      return NextResponse.json({ ok: false, message: "A note is required." }, { status: 400 });
    }

    const updated = await prisma.license.update({
      where: { id: license.id },
      data: {
        notes: `${license.notes}\nDiscord bot note: ${note}`.trim(),
      },
      include: { product: true, customer: true },
    });

    await prisma.activityLog.create({
      data: {
        actorEmail: "discord-bot",
        action: "license note",
        entityType: "License",
        entityId: license.id,
        metadata: JSON.stringify({ key, note }),
      },
    });

    return NextResponse.json({ ok: true, message: "License note added.", license: updated });
  }

  if (action === "sync") {
    await prisma.activityLog.create({
      data: {
        actorEmail: "discord-bot",
        action: "license sync requested",
        entityType: "License",
        entityId: license.id,
        metadata: JSON.stringify({ key }),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    message: action === "sync" ? "License sync queued." : "License loaded.",
    license,
  });
}
