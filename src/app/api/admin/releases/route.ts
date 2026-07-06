import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { productReleaseSchema } from "@/lib/validation/schemas";

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

function toReleaseData(data: ReturnType<typeof productReleaseSchema.parse>) {
  return {
    productId: data.productId,
    version: data.version,
    title: data.title,
    notes: data.notes,
    releaseType: data.releaseType,
    status: data.status,
    isLatest: data.isLatest,
    publishedAt: data.status === "Published" ? publishedDate(data.publishedAt) || new Date() : publishedDate(data.publishedAt),
  };
}

export async function GET() {
  const { response } = await requireAdminApi("documentation.manage");
  if (response) return response;

  const releases = await prisma.productRelease.findMany({
    include: includeProduct,
    orderBy: [{ isLatest: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ ok: true, releases });
}

export async function POST(request: Request) {
  const { admin, response } = await requireAdminApi("documentation.manage");
  if (response) return response;

  const parsed = productReleaseSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid release." }, { status: 400 });
  }

  try {
    const data = toReleaseData(parsed.data);

    if (data.isLatest) {
      await prisma.productRelease.updateMany({
        where: { productId: data.productId },
        data: { isLatest: false },
      });
    }

    const release = await prisma.productRelease.create({
      data,
      include: includeProduct,
    });

    await logActivity({
      actorEmail: admin.email,
      action: "created product release",
      entityType: "ProductRelease",
      entityId: release.id,
      metadata: { title: release.title, productId: release.productId, version: release.version },
    });

    return NextResponse.json({ ok: true, release }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return NextResponse.json({ ok: false, message: "A release for that product and version already exists." }, { status: 409 });
    }

    return NextResponse.json({ ok: false, message: "Unable to create release." }, { status: 500 });
  }
}
