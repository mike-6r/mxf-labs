import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  createAdminTwoFactorSetup,
  disableAdminTwoFactor,
  enableAdminTwoFactor,
  getAdminTwoFactorSummary,
  regenerateAdminRecoveryCodes,
  verifyAdminTwoFactor,
} from "@/lib/auth/admin-2fa";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { requestIp } from "@/lib/request/ip";

export async function GET() {
  const { admin, response } = await requireAdminApi();
  if (response) return response;

  return NextResponse.json({ ok: true, twoFactor: await getAdminTwoFactorSummary(admin.id) });
}

async function requirePassword(adminId: string, password: unknown) {
  if (typeof password !== "string" || !password) return false;
  const admin = await prisma.adminUser.findUnique({ where: { id: adminId }, select: { passwordHash: true } });
  return admin ? bcrypt.compare(password, admin.passwordHash) : false;
}

export async function POST(request: Request) {
  const { admin, response } = await requireAdminApi();
  if (response) return response;

  const ipAddress = requestIp(request);
  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "";

  if (action === "setup") {
    const setup = await createAdminTwoFactorSetup(admin);
    await logActivity({
      actorEmail: admin.email,
      action: "started admin two-factor setup",
      entityType: "AdminUser",
      entityId: admin.id,
      metadata: { ipAddress },
    });

    return NextResponse.json({ ok: true, setup });
  }

  if (action === "enable") {
    const code = typeof body.code === "string" ? body.code : "";
    const result = await enableAdminTwoFactor(admin, code);

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
    }

    await logActivity({
      actorEmail: admin.email,
      action: "enabled admin two-factor",
      entityType: "AdminUser",
      entityId: admin.id,
      metadata: { ipAddress },
    });

    return NextResponse.json({ ok: true, recoveryCodes: result.recoveryCodes, twoFactor: await getAdminTwoFactorSummary(admin.id) });
  }

  if (action === "disable") {
    const passwordOk = await requirePassword(admin.id, body.password);
    if (!passwordOk) {
      return NextResponse.json({ ok: false, message: "Current password is required." }, { status: 401 });
    }

    await disableAdminTwoFactor(admin.id);
    await logActivity({
      actorEmail: admin.email,
      action: "disabled admin two-factor",
      entityType: "AdminUser",
      entityId: admin.id,
      metadata: { ipAddress },
    });

    return NextResponse.json({ ok: true, twoFactor: await getAdminTwoFactorSummary(admin.id) });
  }

  if (action === "recovery-codes") {
    const code = typeof body.code === "string" ? body.code : "";
    const verification = await verifyAdminTwoFactor(admin.id, code);

    if (!verification.ok) {
      return NextResponse.json({ ok: false, message: "Valid two-factor code is required." }, { status: 401 });
    }

    const recoveryCodes = await regenerateAdminRecoveryCodes(admin.id);
    await logActivity({
      actorEmail: admin.email,
      action: "regenerated admin two-factor recovery codes",
      entityType: "AdminUser",
      entityId: admin.id,
      metadata: { ipAddress },
    });

    return NextResponse.json({ ok: true, recoveryCodes, twoFactor: await getAdminTwoFactorSummary(admin.id) });
  }

  return NextResponse.json({ ok: false, message: "Unsupported two-factor action." }, { status: 400 });
}
