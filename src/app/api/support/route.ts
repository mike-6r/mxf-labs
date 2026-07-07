import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { sendEmail, sendTemplateEmail } from "@/lib/email/resend";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request/ip";
import { escapeHtml } from "@/lib/security/html";
import { publicSupportSchema } from "@/lib/validation/schemas";

async function nextTicketNumber() {
  const count = await prisma.supportTicket.count();
  return `MXF-${String(1001 + count).padStart(4, "0")}`;
}

export async function POST(request: Request) {
  const ipAddress = requestIp(request);
  const rate = checkRateLimit(`support:${ipAddress}`, 10);

  if (!rate.ok) {
    return rateLimitedResponse("Too many support requests.", rate);
  }

  const parsed = publicSupportSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid support request." }, { status: 400 });
  }

  const customer = await getCurrentCustomer();
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: await nextTicketNumber(),
      customerId: customer?.id || null,
      name: parsed.data.name,
      email: parsed.data.email,
      discordUsername: parsed.data.discordUsername || null,
      relatedProductId: parsed.data.relatedProductId || null,
      relatedLicenseId: parsed.data.relatedLicenseId || null,
      priority: parsed.data.priority,
      subject: parsed.data.subject,
      message: parsed.data.message,
      attachmentName: parsed.data.attachmentName || null,
      attachmentsJson: parsed.data.attachmentName ? JSON.stringify([parsed.data.attachmentName]) : "[]",
    },
  });

  await logActivity({
    action: "received support ticket",
    entityType: "SupportTicket",
    entityId: ticket.id,
    metadata: { priority: ticket.priority, ticketNumber: ticket.ticketNumber, ipAddress },
  });

  await Promise.all([
    sendEmail({
      to: process.env.SUPPORT_EMAIL || "support@mxf-labs.com",
      subject: `New support ticket ${ticket.ticketNumber}: ${ticket.subject}`,
      text: `${ticket.name} (${ticket.email}) opened ${ticket.ticketNumber}.\nPriority: ${ticket.priority}\n\n${ticket.message}`,
      html: `<div><h1>${escapeHtml(ticket.ticketNumber)}</h1><p>${escapeHtml(ticket.name)} (${escapeHtml(ticket.email)})</p><p>${escapeHtml(ticket.priority)}</p><p>${escapeHtml(ticket.message)}</p></div>`,
    }),
    sendTemplateEmail({
      to: ticket.email,
      template: "support_update",
      data: { ticketNumber: ticket.ticketNumber, subject: ticket.subject },
    }),
  ]);

  return NextResponse.json({ ok: true, ticketNumber: ticket.ticketNumber }, { status: 201 });
}
