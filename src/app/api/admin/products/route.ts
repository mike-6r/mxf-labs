import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { productSchema } from "@/lib/validation/schemas";

function toProductData(data: ReturnType<typeof productSchema.parse>) {
  return {
    name: data.name,
    slug: data.slug,
    shortDescription: data.shortDescription,
    fullDescription: data.fullDescription,
    featuresJson: JSON.stringify(data.features),
    highlightedFeaturesJson: JSON.stringify(data.highlightedFeatures),
    tagsJson: JSON.stringify(data.tags),
    featureIconsJson: JSON.stringify(data.featureIcons),
    techStackJson: JSON.stringify(data.techStack),
    faqJson: JSON.stringify(data.faq),
    roadmapJson: JSON.stringify(data.roadmap),
    screenshotsJson: JSON.stringify(data.screenshots),
    licenseRulesJson: JSON.stringify(data.licenseRules),
    mediaJson: JSON.stringify(data.media),
    displayJson: JSON.stringify(data.display),
    buttonsJson: JSON.stringify(data.buttons),
    seoJson: JSON.stringify(data.seo),
    price: data.price,
    priceCents: data.priceCents,
    currency: data.currency.toUpperCase(),
    defaultActivationLimit: data.defaultActivationLimit,
    category: data.category,
    version: data.version,
    changelogJson: JSON.stringify(data.changelog),
    documentationLink: data.documentationLink || null,
    supportLink: data.supportLink || null,
    purchaseButtonText: data.purchaseButtonText,
    icon: data.icon,
    visible: data.visible,
    status: data.status,
  };
}

export async function GET() {
  const { response } = await requireAdminApi("products.manage");

  if (response) return response;

  const products = await prisma.product.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ ok: true, products });
}

export async function POST(request: Request) {
  const { admin, response } = await requireAdminApi("products.manage");

  if (response) return response;

  const parsed = productSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid product." }, { status: 400 });
  }

  const product = await prisma.product.create({ data: toProductData(parsed.data) });

  await logActivity({
    actorEmail: admin.email,
    action: "created product",
    entityType: "Product",
    entityId: product.id,
    metadata: { name: product.name },
  });

  return NextResponse.json({ ok: true, product }, { status: 201 });
}
