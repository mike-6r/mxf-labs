import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { auditChanges, requestAuditContext } from "@/lib/db/audit";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { productSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

function toPartialProductData(data: Record<string, unknown>) {
  const mapped: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;

    if (key === "features") {
      mapped.featuresJson = JSON.stringify(value);
    } else if (key === "highlightedFeatures") {
      mapped.highlightedFeaturesJson = JSON.stringify(value);
    } else if (key === "tags") {
      mapped.tagsJson = JSON.stringify(value);
    } else if (key === "featureIcons") {
      mapped.featureIconsJson = JSON.stringify(value);
    } else if (key === "techStack") {
      mapped.techStackJson = JSON.stringify(value);
    } else if (key === "faq") {
      mapped.faqJson = JSON.stringify(value);
    } else if (key === "roadmap") {
      mapped.roadmapJson = JSON.stringify(value);
    } else if (key === "screenshots") {
      mapped.screenshotsJson = JSON.stringify(value);
    } else if (key === "licenseRules") {
      mapped.licenseRulesJson = JSON.stringify(value);
    } else if (key === "media") {
      mapped.mediaJson = JSON.stringify(value);
    } else if (key === "display") {
      mapped.displayJson = JSON.stringify(value);
    } else if (key === "buttons") {
      mapped.buttonsJson = JSON.stringify(value);
    } else if (key === "seo") {
      mapped.seoJson = JSON.stringify(value);
    } else if (key === "changelog") {
      mapped.changelogJson = JSON.stringify(value);
    } else if (key === "currency" && typeof value === "string") {
      mapped.currency = value.toUpperCase();
    } else if (key === "documentationLink" || key === "supportLink") {
      mapped[key] = value || null;
    } else {
      mapped[key] = value;
    }
  }

  return mapped;
}

export async function PATCH(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("products.manage");

  if (response) return response;

  const { id } = await params;
  const parsed = productSchema.partial().safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid product update." }, { status: 400 });
  }

  const before = await prisma.product.findUnique({ where: { id } });
  const data = toPartialProductData(parsed.data);
  const product = await prisma.product.update({
    where: { id },
    data,
  });

  await logActivity({
    actorEmail: admin.email,
    action: "updated product",
    entityType: "Product",
    entityId: product.id,
    metadata: {
      name: product.name,
      changes: auditChanges(before as Record<string, unknown> | null, product as unknown as Record<string, unknown>, Object.keys(data)),
      ...requestAuditContext(request),
    },
  });

  return NextResponse.json({ ok: true, product });
}

export async function DELETE(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("products.manage");

  if (response) return response;

  const { id } = await params;
  await prisma.product.delete({ where: { id } });

  await logActivity({
    actorEmail: admin.email,
    action: "deleted product",
    entityType: "Product",
    entityId: id,
    metadata: requestAuditContext(request),
  });

  return NextResponse.json({ ok: true });
}
