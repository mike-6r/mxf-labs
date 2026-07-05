import { NextResponse } from "next/server";
import { requireDiscordBot } from "@/lib/auth/bot";
import { prisma } from "@/lib/db/prisma";
import { botProductSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const unauthorized = requireDiscordBot(request);
  if (unauthorized) return unauthorized;

  const parsed = botProductSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid product payload." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { slug: parsed.data.slug },
    include: { releases: { orderBy: { createdAt: "desc" } }, downloads: true },
  });

  if (!product) {
    return NextResponse.json({ ok: false, message: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, product });
}
