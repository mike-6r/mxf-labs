import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string }> };

const featureFlagUpdateSchema = z.object({
  enabled: z.boolean(),
});

export async function PATCH(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("feature_flags.manage");
  if (response) return response;

  const parsed = featureFlagUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid feature flag update." }, { status: 400 });
  }

  const { id } = await params;
  const flag = await prisma.featureFlag.update({
    where: { id },
    data: { enabled: parsed.data.enabled },
  });

  await logActivity({
    actorEmail: admin.email,
    action: parsed.data.enabled ? "enabled feature flag" : "disabled feature flag",
    entityType: "FeatureFlag",
    entityId: flag.id,
    metadata: { key: flag.key },
  });

  return NextResponse.json({ ok: true, flag });
}
