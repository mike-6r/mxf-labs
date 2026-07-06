import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { generateLicenseKey, normalizeAllowedVersionsInput } from "@/lib/license/generate";
import { licenseCreateSchema } from "@/lib/validation/schemas";

export async function GET() {
  const { response } = await requireAdminApi("licenses.manage");

  if (response) return response;

  const licenses = await prisma.license.findMany({
    include: { customer: true, product: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, licenses });
}

export async function POST(request: Request) {
  const { admin, response } = await requireAdminApi("licenses.manage");

  if (response) return response;

  const parsed = licenseCreateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid license." }, { status: 400 });
  }

  const license = await prisma.license.create({
    data: {
      key: generateLicenseKey(),
      productId: parsed.data.productId || null,
      customerId: parsed.data.customerId || null,
      expirationDate: parsed.data.expirationDate ? new Date(parsed.data.expirationDate) : null,
      licenseType: parsed.data.licenseType,
      minimumVersion: parsed.data.minimumVersion || null,
      allowedVersionsJson: normalizeAllowedVersionsInput(parsed.data.allowedVersionsJson),
      maxActivations: parsed.data.maxActivations,
      notes: parsed.data.notes || "",
      status: "Active",
    },
    include: { customer: true, product: true },
  });

  await logActivity({
    actorEmail: admin.email,
    action: "created license",
    entityType: "License",
    entityId: license.id,
    metadata: { key: license.key },
  });

  return NextResponse.json({ ok: true, license }, { status: 201 });
}
