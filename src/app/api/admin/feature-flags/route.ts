import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";

const featureFlagSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/, "Use lowercase snake_case."),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(600).default(""),
  enabled: z.boolean().default(false),
  scope: z.string().trim().min(1).max(80).default("Global"),
});

function isUniqueConstraint(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function GET() {
  const { response } = await requireAdminApi("feature_flags.manage");
  if (response) return response;

  const flags = await prisma.featureFlag.findMany({ orderBy: [{ scope: "asc" }, { key: "asc" }] });
  return NextResponse.json({ ok: true, flags });
}

export async function POST(request: Request) {
  const { admin, response } = await requireAdminApi("feature_flags.manage");
  if (response) return response;

  const parsed = featureFlagSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid feature flag." }, { status: 400 });
  }

  try {
    const flag = await prisma.featureFlag.create({ data: parsed.data });

    await logActivity({
      actorEmail: admin.email,
      action: "created feature flag",
      entityType: "FeatureFlag",
      entityId: flag.id,
      metadata: { key: flag.key, scope: flag.scope, enabled: flag.enabled },
    });

    return NextResponse.json({ ok: true, flag }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return NextResponse.json({ ok: false, message: "A feature flag with that key already exists." }, { status: 409 });
    }

    return NextResponse.json({ ok: false, message: "Unable to create feature flag." }, { status: 500 });
  }
}
