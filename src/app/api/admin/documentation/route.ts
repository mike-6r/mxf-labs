import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { documentationArticleSchema } from "@/lib/validation/schemas";

function toArticleData(data: ReturnType<typeof documentationArticleSchema.parse>) {
  return {
    title: data.title,
    slug: data.slug,
    category: data.category,
    excerpt: data.excerpt,
    bodyMarkdown: data.bodyMarkdown,
    version: data.version,
    productId: data.productId || null,
    productVersion: data.productVersion || null,
    visible: data.visible,
    sortOrder: data.sortOrder,
  };
}

function isUniqueConstraint(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

const includeProduct = {
  product: { select: { id: true, name: true, slug: true } },
};

export async function GET() {
  const { response } = await requireAdminApi("documentation.manage");
  if (response) return response;

  const articles = await prisma.documentationArticle.findMany({
    include: includeProduct,
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ ok: true, articles });
}

export async function POST(request: Request) {
  const { admin, response } = await requireAdminApi("documentation.manage");
  if (response) return response;

  const parsed = documentationArticleSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid documentation article." }, { status: 400 });
  }

  try {
    const article = await prisma.documentationArticle.create({
      data: toArticleData(parsed.data),
      include: includeProduct,
    });

    await logActivity({
      actorEmail: admin.email,
      action: "created documentation article",
      entityType: "DocumentationArticle",
      entityId: article.id,
      metadata: { title: article.title, slug: article.slug, productId: article.productId },
    });

    return NextResponse.json({ ok: true, article }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return NextResponse.json({ ok: false, message: "A documentation article with that slug already exists." }, { status: 409 });
    }

    return NextResponse.json({ ok: false, message: "Unable to create documentation article." }, { status: 500 });
  }
}
