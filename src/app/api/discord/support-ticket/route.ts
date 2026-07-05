import { NextResponse } from "next/server";
import { requireDiscordBot } from "@/lib/auth/bot";
import { prisma } from "@/lib/db/prisma";

async function nextTicketNumber() {
  const count = await prisma.supportTicket.count();
  return `MXF-${String(1001 + count).padStart(4, "0")}`;
}

export async function POST(request: Request) {
  const unauthorized = requireDiscordBot(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" && body.email.includes("@") ? body.email : "";
  const discordId = typeof body.discordId === "string" ? body.discordId : "";
  const name = typeof body.name === "string" ? body.name : "Discord Customer";
  const priority = typeof body.priority === "string" ? body.priority : "Normal";
  const subject = typeof body.subject === "string" ? body.subject : "Discord support request";
  const message = typeof body.message === "string" ? body.message : "Created from the MxF Labs Discord bot.";
  const productSlug = typeof body.productSlug === "string" ? body.productSlug : "";
  const licenseKey = typeof body.licenseKey === "string" ? body.licenseKey : "";

  if (!discordId && !email) {
    return NextResponse.json({ ok: false, message: "discordId or email is required." }, { status: 400 });
  }

  const [customer, product, license] = await Promise.all([
    discordId ? prisma.customer.findFirst({ where: { discordId } }) : email ? prisma.customer.findUnique({ where: { email } }) : null,
    productSlug ? prisma.product.findUnique({ where: { slug: productSlug } }) : null,
    licenseKey ? prisma.license.findUnique({ where: { key: licenseKey } }) : null,
  ]);

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: await nextTicketNumber(),
      customerId: customer?.id || null,
      name,
      email: email || customer?.email || `${discordId}@discord.mxf-labs.local`,
      discordUsername: typeof body.discordUsername === "string" ? body.discordUsername : null,
      relatedProductId: product?.id || null,
      relatedLicenseId: license?.id || null,
      priority,
      status: "Open",
      subject,
      message,
      attachmentsJson: "[]",
      internalNotes: `Created from Discord bot ticket type: ${body.type || "General Support"}`,
    },
  });

  await prisma.activityLog.create({
    data: {
      actorEmail: "discord-bot",
      action: "created support ticket from discord",
      entityType: "SupportTicket",
      entityId: ticket.id,
      metadata: JSON.stringify({ ticketNumber: ticket.ticketNumber, discordId, productSlug, licenseKey }),
    },
  });

  return NextResponse.json({ ok: true, ticketNumber: ticket.ticketNumber }, { status: 201 });
}
