import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { documentationArticleSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

function toPartialArticleData(data: Partial<ReturnType<typeof documentationArticleSchema.parse>>) {
  const mapped: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === "productId" || key === "productVersion") {
      mapped[key] = value || null;
    } else {
      mapped[key] = value;
    }
  }

  return mapped;
}

function isUniqueConstraint(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

const includeProduct = {
  product: { select: { id: true, name: true, slug: true } },
};

export async function PATCH(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("documentation.manage");
  if (response) return response;

  const parsed = documentationArticleSchema.partial().safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid documentation update." }, { status: 400 });
  }

  const { id } = await params;

  try {
    const article = await prisma.documentationArticle.update({
      where: { id },
      data: toPartialArticleData(parsed.data),
      include: includeProduct,
    });

    await logActivity({
      actorEmail: admin.email,
      action: "updated documentation article",
      entityType: "DocumentationArticle",
      entityId: article.id,
      metadata: { title: article.title, slug: article.slug, productId: article.productId },
    });

    return NextResponse.json({ ok: true, article });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return NextResponse.json({ ok: false, message: "A documentation article with that slug already exists." }, { status: 409 });
    }

    return NextResponse.json({ ok: false, message: "Unable to update documentation article." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("documentation.manage");
  if (response) return response;

  const { id } = await params;
  await prisma.documentationArticle.delete({ where: { id } });

  await logActivity({
    actorEmail: admin.email,
    action: "deleted documentation article",
    entityType: "DocumentationArticle",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
