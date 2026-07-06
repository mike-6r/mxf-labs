import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { createProductStorageKey, writeLocalStorageFile } from "@/lib/storage/local";
import { productDownloadSchema } from "@/lib/validation/schemas";

const includeRelations = {
  product: { select: { id: true, name: true, slug: true } },
  release: { select: { id: true, title: true, version: true, productId: true } },
};

function isUniqueConstraint(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function stringFromForm(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function boolFromForm(form: FormData, key: string, fallback = false) {
  const value = form.get(key);
  if (value === null) return fallback;
  return value === "on" || value === "true" || value === "1";
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value && "name" in value && value.size > 0;
}

function inferFileType(filename: string, fallback: string) {
  if (fallback && fallback !== "Other") return fallback;
  const extension = filename.split(".").pop()?.toUpperCase();
  if (extension === "JAR" || extension === "ZIP" || extension === "PDF" || extension === "JSON" || extension === "TXT") return extension;
  return "Other";
}

function checksum(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function parseDownloadForm(request: Request) {
  const form = await request.formData();
  const productId = stringFromForm(form, "productId");
  const product = productId
    ? await prisma.product.findUnique({ where: { id: productId }, select: { id: true, slug: true, version: true } })
    : null;
  const file = form.get("file");
  const uploadedFile = isUploadFile(file) ? file : null;
  const explicitFilename = stringFromForm(form, "filename");
  const filename = explicitFilename || uploadedFile?.name || "";
  const version = stringFromForm(form, "version") || product?.version || "0.1.0";
  let storageKey = stringFromForm(form, "storageKey");
  let fileSize = Number(stringFromForm(form, "fileSize") || 0);
  let fileChecksum = stringFromForm(form, "checksum");
  let fileType = inferFileType(filename, stringFromForm(form, "fileType") || "Other");

  if (uploadedFile) {
    if (!product) {
      return { error: NextResponse.json({ ok: false, message: "Choose a product before uploading a file." }, { status: 400 }) };
    }

    const buffer = Buffer.from(await uploadedFile.arrayBuffer());
    storageKey = createProductStorageKey({ productSlug: product.slug, version, filename });
    storageKey = await writeLocalStorageFile(storageKey, buffer);
    fileSize = buffer.length;
    fileChecksum = checksum(buffer);
    fileType = inferFileType(filename, fileType);
  }

  const parsed = productDownloadSchema.safeParse({
    productId,
    releaseId: stringFromForm(form, "releaseId"),
    filename,
    fileType,
    storageKey,
    fileSize,
    checksum: fileChecksum,
    version,
    visible: boolFromForm(form, "visible", true),
    requiresLicense: boolFromForm(form, "requiresLicense", true),
  });

  if (!parsed.success) {
    return { error: NextResponse.json({ ok: false, message: "Invalid download file." }, { status: 400 }) };
  }

  if (parsed.data.releaseId) {
    const release = await prisma.productRelease.findUnique({
      where: { id: parsed.data.releaseId },
      select: { productId: true },
    });

    if (!release || release.productId !== parsed.data.productId) {
      return { error: NextResponse.json({ ok: false, message: "The selected release must belong to the selected product." }, { status: 400 }) };
    }
  }

  return { data: parsed.data };
}

function toDownloadData(data: ReturnType<typeof productDownloadSchema.parse>) {
  return {
    productId: data.productId,
    releaseId: data.releaseId || null,
    filename: data.filename,
    fileType: data.fileType,
    storageKey: data.storageKey,
    fileSize: data.fileSize,
    checksum: data.checksum || null,
    version: data.version,
    visible: data.visible,
    requiresLicense: data.requiresLicense,
  };
}

export async function GET() {
  const { response } = await requireAdminApi("downloads.manage");
  if (response) return response;

  const downloads = await prisma.productDownload.findMany({
    include: includeRelations,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, downloads });
}

export async function POST(request: Request) {
  const { admin, response } = await requireAdminApi("downloads.manage");
  if (response) return response;

  const parsed = await parseDownloadForm(request);
  if (parsed.error) return parsed.error;

  try {
    const download = await prisma.productDownload.create({
      data: toDownloadData(parsed.data),
      include: includeRelations,
    });

    await logActivity({
      actorEmail: admin.email,
      action: "created product download",
      entityType: "ProductDownload",
      entityId: download.id,
      metadata: { filename: download.filename, productId: download.productId, releaseId: download.releaseId },
    });

    return NextResponse.json({ ok: true, download }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return NextResponse.json({ ok: false, message: "A download with that storage key already exists." }, { status: 409 });
    }

    return NextResponse.json({ ok: false, message: "Unable to create download." }, { status: 500 });
  }
}
