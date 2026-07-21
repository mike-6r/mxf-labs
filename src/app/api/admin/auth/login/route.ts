import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionValue,
  hashSessionValue,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";
import { getAdminTwoFactorState, verifyAdminTwoFactor } from "@/lib/auth/admin-2fa";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request/ip";
import { crossSiteAdminResponse } from "@/lib/security/admin-origin";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().max(32).optional().or(z.literal("")),
});

function envAdminCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) return null;

  return { email, password };
}

function matchesEnvAdmin(email: string, password: string) {
  const envAdmin = envAdminCredentials();
  return Boolean(envAdmin && email.trim().toLowerCase() === envAdmin.email && password === envAdmin.password);
}

export async function POST(request: Request) {
  const crossSiteResponse = crossSiteAdminResponse(request.headers, request.method, new URL(request.url).origin);
  if (crossSiteResponse) return crossSiteResponse;

  const ipAddress = requestIp(request);
  const rate = checkRateLimit(`admin-login:${ipAddress}`, 8);

  if (!rate.ok) {
    return rateLimitedResponse("Too many login attempts.", rate);
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid credentials." }, { status: 400 });
  }

  let admin = await prisma.adminUser.findFirst({
    where: { email: parsed.data.email, isActive: true },
  });

  if (!admin) {
    if (matchesEnvAdmin(parsed.data.email, parsed.data.password)) {
      admin = await prisma.adminUser.upsert({
        where: { email: parsed.data.email.toLowerCase() },
        update: {
          isActive: true,
          role: "OWNER",
          passwordHash: await bcrypt.hash(parsed.data.password, 12),
        },
        create: {
          email: parsed.data.email.toLowerCase(),
          name: "MxF Admin",
          role: "OWNER",
          permissionsJson: JSON.stringify(["*"]),
          passwordHash: await bcrypt.hash(parsed.data.password, 12),
          isActive: true,
        },
      });

      await logActivity({
        actorEmail: admin.email,
        action: "synced admin password from environment",
        entityType: "AdminUser",
        entityId: admin.id,
        metadata: { reason: "env_admin_recovery", ipAddress },
      }).catch(() => undefined);
    }
  }

  if (!admin) {
    await logActivity({
      actorEmail: parsed.data.email,
      action: "failed admin login",
      entityType: "AdminUser",
      metadata: { reason: "unknown_admin", ipAddress },
    }).catch(() => undefined);
    return NextResponse.json({ ok: false, message: "Invalid credentials." }, { status: 401 });
  }

  let valid = await bcrypt.compare(parsed.data.password, admin.passwordHash);

  if (!valid && matchesEnvAdmin(parsed.data.email, parsed.data.password)) {
    admin = await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        isActive: true,
        role: "OWNER",
      },
    });
    valid = true;

    await logActivity({
      actorEmail: admin.email,
      action: "refreshed admin password hash from environment",
      entityType: "AdminUser",
      entityId: admin.id,
      metadata: { reason: "env_password_hash_mismatch", ipAddress },
    }).catch(() => undefined);
  }

  if (!valid) {
    await logActivity({
      actorEmail: admin.email,
      action: "failed admin login",
      entityType: "AdminUser",
      entityId: admin.id,
      metadata: { reason: "invalid_password", ipAddress },
    }).catch(() => undefined);
    return NextResponse.json({ ok: false, message: "Invalid credentials." }, { status: 401 });
  }

  const twoFactor = await getAdminTwoFactorState(admin.id);
  if (twoFactor.enabled) {
    if (!parsed.data.twoFactorCode) {
      return NextResponse.json({ ok: false, twoFactorRequired: true, message: "Two-factor code required." });
    }

    const verification = await verifyAdminTwoFactor(admin.id, parsed.data.twoFactorCode);
    if (!verification.ok) {
      await logActivity({
        actorEmail: admin.email,
        action: "failed admin two-factor challenge",
        entityType: "AdminUser",
        entityId: admin.id,
        metadata: { reason: verification.method, ipAddress },
      }).catch(() => undefined);
      return NextResponse.json({ ok: false, twoFactorRequired: true, message: "Invalid two-factor code." }, { status: 401 });
    }
  }

  const sessionValue = await createAdminSessionValue({ adminId: admin.id, email: admin.email });
  const tokenHash = await hashSessionValue(sessionValue);

  await prisma.adminSession.create({
    data: {
      tokenHash,
      adminUserId: admin.id,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  await logActivity({
    actorEmail: admin.email,
    action: "logged in",
    entityType: "AdminUser",
    entityId: admin.id,
    metadata: { ipAddress, twoFactor: twoFactor.enabled },
  });

  return NextResponse.json({ ok: true });
}
