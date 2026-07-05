import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { licenseValidationSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const { admin, response } = await requireAdminApi("licenses.manage");

  if (response) return response;

  const parsed = licenseValidationSchema.pick({ key: true }).safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid reset request." }, { status: 400 });
  }

  const license = await prisma.license.findUnique({ where: { key: parsed.data.key } });

  if (!license) {
    return NextResponse.json({ ok: false, message: "License not found." }, { status: 404 });
  }

  await prisma.licenseActivation.updateMany({
    where: { licenseId: license.id },
    data: { status: "Reset" },
  });
  await prisma.license.update({
    where: { id: license.id },
    data: {
      currentActivations: 0,
      resetCount: { increment: 1 },
      lastResetAt: new Date(),
    },
  });

  await logActivity({
    actorEmail: admin.email,
    action: "reset license activations",
    entityType: "License",
    entityId: license.id,
    metadata: { key: license.key },
  });

  return NextResponse.json({ ok: true, reset: true });
}
