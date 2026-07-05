import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { announcementSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("announcements.manage");

  if (response) return response;

  const parsed = announcementSchema.partial().safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid announcement update." }, { status: 400 });
  }

  const { id } = await params;
  const announcement = await prisma.announcement.update({ where: { id }, data: parsed.data });

  await logActivity({
    actorEmail: admin.email,
    action: "updated announcement",
    entityType: "Announcement",
    entityId: announcement.id,
    metadata: { title: announcement.title },
  });

  return NextResponse.json({ ok: true, announcement });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("announcements.manage");

  if (response) return response;

  const { id } = await params;
  await prisma.announcement.delete({ where: { id } });

  await logActivity({
    actorEmail: admin.email,
    action: "deleted announcement",
    entityType: "Announcement",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
