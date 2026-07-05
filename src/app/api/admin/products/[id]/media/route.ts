import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string }> };
type MediaSlot = "cardImage" | "heroImage" | "mockupImage" | "featuredImage" | "galleryImages" | "showcaseImages";

type ProductMedia = {
  cardImage?: string;
  heroImage?: string;
  mockupImage?: string;
  featuredImage?: string;
  galleryImages: string[];
  galleryCaptions: string[];
  showcaseImages: string[];
  showcaseCaptions: string[];
};

const mediaSlots: MediaSlot[] = ["cardImage", "heroImage", "mockupImage", "featuredImage", "galleryImages", "showcaseImages"];
const allowedTypes = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);
const maxUploadBytes = 8 * 1024 * 1024;

function parseMedia(value: string): ProductMedia {
  try {
    const parsed = JSON.parse(value || "{}");
    return {
      cardImage: typeof parsed.cardImage === "string" ? parsed.cardImage : "",
      heroImage: typeof parsed.heroImage === "string" ? parsed.heroImage : "",
      mockupImage: typeof parsed.mockupImage === "string" ? parsed.mockupImage : "",
      featuredImage: typeof parsed.featuredImage === "string" ? parsed.featuredImage : "",
      galleryImages: Array.isArray(parsed.galleryImages) ? parsed.galleryImages.map(String).filter(Boolean) : [],
      galleryCaptions: Array.isArray(parsed.galleryCaptions) ? parsed.galleryCaptions.map(String) : [],
      showcaseImages: Array.isArray(parsed.showcaseImages) ? parsed.showcaseImages.map(String).filter(Boolean) : [],
      showcaseCaptions: Array.isArray(parsed.showcaseCaptions) ? parsed.showcaseCaptions.map(String) : [],
    };
  } catch {
    return { cardImage: "", heroImage: "", mockupImage: "", featuredImage: "", galleryImages: [], galleryCaptions: [], showcaseImages: [], showcaseCaptions: [] };
  }
}

function safeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "product";
}

export async function POST(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("products.manage");

  if (response) return response;

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    return NextResponse.json({ ok: false, message: "Product not found." }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const slot = String(formData?.get("slot") || "") as MediaSlot;
  const file = formData?.get("file");

  if (!mediaSlots.includes(slot)) {
    return NextResponse.json({ ok: false, message: "Invalid media slot." }, { status: 400 });
  }

  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ ok: false, message: "Select an image file to upload." }, { status: 400 });
  }

  const extension = allowedTypes.get(file.type);

  if (!extension) {
    return NextResponse.json({ ok: false, message: "Only PNG, JPG, WEBP, and GIF images are supported." }, { status: 400 });
  }

  if (file.size > maxUploadBytes) {
    return NextResponse.json({ ok: false, message: "Images must be 8 MB or smaller." }, { status: 400 });
  }

  const productSlug = safeSegment(product.slug);
  const uploadDir = path.join(process.cwd(), "public", "media", "products", productSlug);
  await mkdir(uploadDir, { recursive: true });

  const baseName = slot === "galleryImages" ? "gallery" : slot === "showcaseImages" ? "showcase" : slot.replace(/Image$/, "").toLowerCase();
  const filename = `${baseName}-${Date.now()}${extension}`;
  const absolutePath = path.join(uploadDir, filename);
  const publicPath = `/media/products/${productSlug}/${filename}`;

  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  const media = parseMedia(product.mediaJson);

  if (slot === "galleryImages") {
    media.galleryImages = [...media.galleryImages, publicPath];
  } else if (slot === "showcaseImages") {
    media.showcaseImages = [...media.showcaseImages, publicPath];
  } else {
    media[slot] = publicPath;
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { mediaJson: JSON.stringify(media) },
  });

  await logActivity({
    actorEmail: admin.email,
    action: "uploaded product media",
    entityType: "Product",
    entityId: product.id,
    metadata: { slot, path: publicPath },
  });

  return NextResponse.json({ ok: true, path: publicPath, product: updated });
}
