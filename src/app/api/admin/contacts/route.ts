import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const { response } = await requireAdminApi("contacts.manage");

  if (response) return response;

  const submissions = await prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ok: true, submissions });
}
