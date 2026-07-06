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
import { checkRateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request/ip";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().max(32).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const ipAddress = requestIp(request);
  const rate = checkRateLimit(`admin-login:${ipAddress}`, 8);

  if (!rate.ok) {
    return NextResponse.json({ ok: false, message: "Too many login attempts." }, { status: 429 });
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid credentials." }, { status: 400 });
  }

  const admin = await prisma.adminUser.findFirst({
    where: { email: parsed.data.email, isActive: true },
  });

  if (!admin) {
    await logActivity({
      actorEmail: parsed.data.email,
      action: "failed admin login",
      entityType: "AdminUser",
      metadata: { reason: "unknown_admin", ipAddress },
    }).catch(() => undefined);
    return NextResponse.json({ ok: false, message: "Invalid credentials." }, { status: 401 });
  }

  const valid = await bcrypt.compare(parsed.data.password, admin.passwordHash);

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
