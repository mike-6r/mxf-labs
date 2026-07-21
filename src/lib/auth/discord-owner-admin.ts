import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionValue,
  hashSessionValue,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";

type DiscordOwnerProfile = {
  discordId?: string | null;
  email?: string | null;
  name?: string | null;
};

function configuredOwnerDiscordIds() {
  return [
    process.env.ADMIN_DISCORD_IDS,
    process.env.ADMIN_DISCORD_ID,
    process.env.OWNER_DISCORD_IDS,
    process.env.OWNER_DISCORD_ID,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(/[,\s]+/))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isAdminDiscordId(discordId?: string | null) {
  if (!discordId) return false;
  return configuredOwnerDiscordIds().includes(discordId);
}

function adminEmailForOwner(profile: DiscordOwnerProfile) {
  return (process.env.ADMIN_EMAIL || profile.email || `${profile.discordId}@discord.mxf-labs.local`).trim().toLowerCase();
}

async function adminPasswordHash() {
  const password = process.env.ADMIN_PASSWORD;
  return bcrypt.hash(password || crypto.randomUUID(), 12);
}

export async function syncDiscordOwnerAdmin(profile: DiscordOwnerProfile) {
  if (!isAdminDiscordId(profile.discordId)) {
    return null;
  }

  const email = adminEmailForOwner(profile);
  const password = process.env.ADMIN_PASSWORD;
  const data = {
    name: profile.name || "MxF Owner",
    role: "OWNER",
    permissionsJson: JSON.stringify(["*"]),
    isActive: true,
    passwordHash: password ? await bcrypt.hash(password, 12) : await adminPasswordHash(),
  };

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: data,
    create: {
      email,
      ...data,
    },
  });

  await logActivity({
    actorEmail: admin.email,
    action: "synced Discord owner admin",
    entityType: "AdminUser",
    entityId: admin.id,
    metadata: { discordId: profile.discordId },
  }).catch(() => undefined);

  return admin;
}

export async function setDiscordOwnerAdminSession(response: NextResponse, profile: DiscordOwnerProfile) {
  const admin = await syncDiscordOwnerAdmin(profile);

  if (!admin) {
    return null;
  }

  const sessionValue = await createAdminSessionValue({ adminId: admin.id, email: admin.email });

  await prisma.adminSession.create({
    data: {
      tokenHash: await hashSessionValue(sessionValue),
      adminUserId: admin.id,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
    },
  });

  response.cookies.set(ADMIN_SESSION_COOKIE, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return admin;
}
