import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { announcementSchema } from "@/lib/validation/schemas";

export async function GET() {
  const { response } = await requireAdminApi("announcements.manage");

  if (response) return response;

  const announcements = await prisma.announcement.findMany({ orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }] });
  return NextResponse.json({ ok: true, announcements });
}

export async function POST(request: Request) {
  const { admin, response } = await requireAdminApi("announcements.manage");

  if (response) return response;

  const parsed = announcementSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid announcement." }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({ data: parsed.data });

  await logActivity({
    actorEmail: admin.email,
    action: "created announcement",
    entityType: "Announcement",
    entityId: announcement.id,
    metadata: { title: announcement.title },
  });

  return NextResponse.json({ ok: true, announcement }, { status: 201 });
}
