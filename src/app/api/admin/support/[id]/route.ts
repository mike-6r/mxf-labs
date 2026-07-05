import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { sendTemplateEmail } from "@/lib/email/resend";
import { supportTicketUpdateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("support.manage");

  if (response) return response;

  const parsed = supportTicketUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid ticket update." }, { status: 400 });
  }

  const { id } = await params;
  const { note, ...data } = parsed.data;

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data,
    include: { relatedProduct: true, notes: { orderBy: { createdAt: "desc" } } },
  });

  if (note) {
    await prisma.supportTicketNote.create({
      data: {
        ticketId: id,
        author: admin.email,
        body: note,
        internal: true,
      },
    });
  }

  await logActivity({
    actorEmail: admin.email,
    action: "updated support ticket",
    entityType: "SupportTicket",
    entityId: ticket.id,
    metadata: { ticketNumber: ticket.ticketNumber, status: ticket.status },
  });

  if (ticket.customerId) {
    await prisma.customerNotification.create({
      data: {
        customerId: ticket.customerId,
        title: `Support ticket ${ticket.ticketNumber} updated`,
        body: `${ticket.subject} is now ${ticket.status}.`,
        type: "Support",
      },
    });
  }

  await sendTemplateEmail({
    to: ticket.email,
    template: "support_update",
    data: { ticketNumber: ticket.ticketNumber, subject: ticket.subject },
  });

  const updated = await prisma.supportTicket.findUnique({
    where: { id },
    include: { relatedProduct: true, notes: { orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json({ ok: true, ticket: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("support.manage");

  if (response) return response;

  const { id } = await params;
  await prisma.supportTicket.delete({ where: { id } });

  await logActivity({
    actorEmail: admin.email,
    action: "deleted support ticket",
    entityType: "SupportTicket",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
