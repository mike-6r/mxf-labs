import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { fulfillPaidOrder } from "@/lib/payments/fulfillment";
import { verifyPayPalWebhook } from "@/lib/payments/paypal";

function fallbackEventId(body: unknown) {
  return `paypal-${createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 32)}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ ok: false, message: "Invalid PayPal webhook." }, { status: 400 });
  }

  const verified = await verifyPayPalWebhook({ headers: request.headers, body });

  if (!verified) {
    return NextResponse.json({ ok: false, message: "Invalid PayPal signature." }, { status: 401 });
  }

  const event = body as {
    id?: string;
    event_type?: string;
    resource?: { id?: string; supplementary_data?: { related_ids?: { order_id?: string } } };
  };
  const providerOrderId = event.resource?.supplementary_data?.related_ids?.order_id || event.resource?.id;
  const providerEventId = event.id || fallbackEventId(body);
  const order = providerOrderId
    ? await prisma.order.findFirst({ where: { provider: "PayPal", providerOrderId } })
    : null;

  const existingEvent = await prisma.paymentEvent.findUnique({
    where: { provider_providerEventId: { provider: "PayPal", providerEventId } },
  });

  if (existingEvent?.processingStatus === "Processed") {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const paymentEvent = existingEvent
    ? await prisma.paymentEvent.update({
        where: { id: existingEvent.id },
        data: { payloadJson: JSON.stringify(body), eventType: event.event_type || "paypal.event", orderId: order?.id },
      })
    : await prisma.paymentEvent.create({
        data: {
      provider: "PayPal",
      providerEventId,
      eventType: event.event_type || "paypal.event",
      payloadJson: JSON.stringify(body),
      orderId: order?.id,
        },
      });

  if (order && ["PAYMENT.CAPTURE.COMPLETED", "CHECKOUT.ORDER.APPROVED"].includes(event.event_type || "")) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "Paid" } });
    await fulfillPaidOrder(order.id);
    await prisma.paymentEvent.update({
      where: { id: paymentEvent.id },
      data: { processingStatus: "Processed", processedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
