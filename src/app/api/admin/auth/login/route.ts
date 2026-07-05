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
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const rate = checkRateLimit(`admin-login:${request.headers.get("x-forwarded-for") || "local"}`, 8);

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
    return NextResponse.json({ ok: false, message: "Invalid credentials." }, { status: 401 });
  }

  const valid = await bcrypt.compare(parsed.data.password, admin.passwordHash);

  if (!valid) {
    return NextResponse.json({ ok: false, message: "Invalid credentials." }, { status: 401 });
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
  });

  return NextResponse.json({ ok: true });
}
