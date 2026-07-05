import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { contactUpdateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("contacts.manage");

  if (response) return response;

  const parsed = contactUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid contact update." }, { status: 400 });
  }

  const { id } = await params;
  const submission = await prisma.contactSubmission.update({ where: { id }, data: parsed.data });

  await logActivity({
    actorEmail: admin.email,
    action: "updated contact submission",
    entityType: "ContactSubmission",
    entityId: submission.id,
    metadata: { status: submission.status, leadStage: submission.leadStage },
  });

  return NextResponse.json({ ok: true, submission });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("contacts.manage");

  if (response) return response;

  const { id } = await params;
  await prisma.contactSubmission.delete({ where: { id } });

  await logActivity({
    actorEmail: admin.email,
    action: "deleted contact submission",
    entityType: "ContactSubmission",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
