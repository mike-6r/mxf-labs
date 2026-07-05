import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const { response } = await requireAdminApi("support.manage");

  if (response) return response;

  const tickets = await prisma.supportTicket.findMany({
    include: { relatedProduct: true, notes: { orderBy: { createdAt: "desc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ ok: true, tickets });
}
