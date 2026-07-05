import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { visible: true },
    include: { releases: true, documentation: { where: { visible: true } }, changelogEntries: { where: { visible: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, products });
}
