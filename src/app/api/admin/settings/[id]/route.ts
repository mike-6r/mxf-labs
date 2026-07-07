import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { auditChanges, requestAuditContext } from "@/lib/db/audit";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("settings.manage");
  if (response) return response;

  const body = await request.json().catch(() => null);

  if (!body || typeof body.value !== "string") {
    return NextResponse.json({ ok: false, message: "Invalid setting update." }, { status: 400 });
  }

  const { id } = await params;
  const before = await prisma.platformSetting.findUnique({ where: { id } });
  const setting = await prisma.platformSetting.update({
    where: { id },
    data: {
      value: body.value,
      description: typeof body.description === "string" ? body.description : undefined,
    },
  });

  await logActivity({
    actorEmail: admin.email,
    action: "updated platform setting",
    entityType: "PlatformSetting",
    entityId: setting.id,
    metadata: {
      key: setting.key,
      changes: auditChanges(before as Record<string, unknown> | null, setting as unknown as Record<string, unknown>, ["value", "description"]),
      ...requestAuditContext(request),
    },
  });

  return NextResponse.json({ ok: true, setting });
}
