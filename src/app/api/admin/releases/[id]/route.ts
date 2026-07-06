import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { productReleaseSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

const includeProduct = {
  product: { select: { id: true, name: true, slug: true } },
};

function isUniqueConstraint(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function publishedDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toPartialReleaseData(data: Partial<ReturnType<typeof productReleaseSchema.parse>>) {
  const mapped: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === "publishedAt") {
      mapped.publishedAt = publishedDate(String(value || ""));
    } else {
      mapped[key] = value;
    }
  }

  if (mapped.status === "Published" && !mapped.publishedAt) {
    mapped.publishedAt = new Date();
  }

  return mapped;
}

export async function PATCH(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("documentation.manage");
  if (response) return response;

  const parsed = productReleaseSchema.partial().safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid release update." }, { status: 400 });
  }

  const { id } = await params;

  try {
    const data = toPartialReleaseData(parsed.data);
    const productId = typeof data.productId === "string" ? data.productId : undefined;

    if (data.isLatest === true) {
      const existing = productId ? null : await prisma.productRelease.findUnique({ where: { id }, select: { productId: true } });
      const latestProductId = productId || existing?.productId;

      if (!latestProductId) {
        return NextResponse.json({ ok: false, message: "Release not found." }, { status: 404 });
      }

      await prisma.productRelease.updateMany({
        where: { productId: latestProductId, id: { not: id } },
        data: { isLatest: false },
      });
    }

    const release = await prisma.productRelease.update({
      where: { id },
      data,
      include: includeProduct,
    });

    await logActivity({
      actorEmail: admin.email,
      action: "updated product release",
      entityType: "ProductRelease",
      entityId: release.id,
      metadata: { title: release.title, productId: release.productId, version: release.version },
    });

    return NextResponse.json({ ok: true, release });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return NextResponse.json({ ok: false, message: "A release for that product and version already exists." }, { status: 409 });
    }

    return NextResponse.json({ ok: false, message: "Unable to update release." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("documentation.manage");
  if (response) return response;

  const { id } = await params;
  await prisma.productRelease.delete({ where: { id } });

  await logActivity({
    actorEmail: admin.email,
    action: "deleted product release",
    entityType: "ProductRelease",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
