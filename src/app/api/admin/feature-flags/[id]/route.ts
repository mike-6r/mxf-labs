import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { auditChanges, requestAuditContext } from "@/lib/db/audit";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string }> };

const featureFlagUpdateSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/)
    .optional(),
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(600).optional(),
  enabled: z.boolean().optional(),
  scope: z.string().trim().min(1).max(80).optional(),
});

function isUniqueConstraint(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function PATCH(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("feature_flags.manage");
  if (response) return response;

  const parsed = featureFlagUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid feature flag update." }, { status: 400 });
  }

  const { id } = await params;
  try {
    const before = await prisma.featureFlag.findUnique({ where: { id } });
    const flag = await prisma.featureFlag.update({
      where: { id },
      data: parsed.data,
    });

    await logActivity({
      actorEmail: admin.email,
      action: typeof parsed.data.enabled === "boolean" ? (parsed.data.enabled ? "enabled feature flag" : "disabled feature flag") : "updated feature flag",
      entityType: "FeatureFlag",
      entityId: flag.id,
      metadata: {
        key: flag.key,
        scope: flag.scope,
        enabled: flag.enabled,
        changes: auditChanges(before as Record<string, unknown> | null, flag as unknown as Record<string, unknown>, Object.keys(parsed.data)),
        ...requestAuditContext(request),
      },
    });

    return NextResponse.json({ ok: true, flag });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return NextResponse.json({ ok: false, message: "A feature flag with that key already exists." }, { status: 409 });
    }

    return NextResponse.json({ ok: false, message: "Unable to update feature flag." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("feature_flags.manage");
  if (response) return response;

  const { id } = await params;
  const flag = await prisma.featureFlag.delete({ where: { id } });

  await logActivity({
    actorEmail: admin.email,
    action: "deleted feature flag",
    entityType: "FeatureFlag",
    entityId: id,
    metadata: { key: flag.key, scope: flag.scope, ...requestAuditContext(request) },
  });

  return NextResponse.json({ ok: true });
}
