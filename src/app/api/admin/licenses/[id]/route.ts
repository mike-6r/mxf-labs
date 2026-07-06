import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { normalizeAllowedVersionsInput } from "@/lib/license/generate";
import { licenseUpdateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("licenses.manage");

  if (response) return response;

  const parsed = licenseUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid license update." }, { status: 400 });
  }

  const { id } = await params;
  const license = await prisma.license.update({
    where: { id },
    data: {
      status: parsed.data.status,
      licenseType: parsed.data.licenseType,
      expirationDate: parsed.data.expirationDate === undefined ? undefined : parsed.data.expirationDate ? new Date(parsed.data.expirationDate) : null,
      minimumVersion: parsed.data.minimumVersion === undefined ? undefined : parsed.data.minimumVersion || null,
      allowedVersionsJson:
        parsed.data.allowedVersionsJson === undefined ? undefined : normalizeAllowedVersionsInput(parsed.data.allowedVersionsJson),
      maxActivations: parsed.data.maxActivations,
      currentActivations: parsed.data.currentActivations,
      notes: parsed.data.notes,
      blacklistedAt: parsed.data.blacklisted === undefined ? undefined : parsed.data.blacklisted ? new Date() : null,
      blacklisted: parsed.data.blacklisted,
    },
    include: { customer: true, product: true },
  });

  await logActivity({
    actorEmail: admin.email,
    action: "updated license",
    entityType: "License",
    entityId: license.id,
    metadata: { status: license.status },
  });

  return NextResponse.json({ ok: true, license });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("licenses.manage");

  if (response) return response;

  const { id } = await params;
  await prisma.$transaction([
    prisma.licenseActivation.deleteMany({ where: { licenseId: id } }),
    prisma.licenseValidation.updateMany({ where: { licenseId: id }, data: { licenseId: null } }),
    prisma.discordServer.updateMany({ where: { linkedLicenseId: id }, data: { linkedLicenseId: null } }),
    prisma.supportTicket.updateMany({ where: { relatedLicenseId: id }, data: { relatedLicenseId: null } }),
    prisma.suspiciousActivityFlag.updateMany({ where: { licenseId: id }, data: { licenseId: null } }),
    prisma.license.delete({ where: { id } }),
  ]);

  await logActivity({
    actorEmail: admin.email,
    action: "deleted license",
    entityType: "License",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
