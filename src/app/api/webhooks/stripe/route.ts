import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { fulfillPaidOrder } from "@/lib/payments/fulfillment";
import { verifyStripeSignature } from "@/lib/payments/stripe";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verified = await verifyStripeSignature({
    rawBody,
    signatureHeader: request.headers.get("stripe-signature"),
  });

  if (!verified) {
    return NextResponse.json({ ok: false, message: "Invalid Stripe signature." }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    id: string;
    type: string;
    data?: { object?: { id?: string; client_reference_id?: string; metadata?: Record<string, string> } };
  };
  const orderId = event.data?.object?.metadata?.orderId || event.data?.object?.client_reference_id;
  const existingEvent = await prisma.paymentEvent.findUnique({
    where: { provider_providerEventId: { provider: "Stripe", providerEventId: event.id } },
  });

  if (existingEvent?.processingStatus === "Processed") {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const paymentEvent = existingEvent
    ? await prisma.paymentEvent.update({
        where: { id: existingEvent.id },
        data: { payloadJson: rawBody, eventType: event.type, orderId },
      })
    : await prisma.paymentEvent.create({
        data: {
      provider: "Stripe",
      providerEventId: event.id,
      eventType: event.type,
      payloadJson: rawBody,
      orderId,
        },
      });

  if (event.type === "checkout.session.completed" && orderId) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "Paid", purchaseIntentId: event.data?.object?.id || null },
    });
    await fulfillPaidOrder(orderId);
    await prisma.paymentEvent.update({
      where: { id: paymentEvent.id },
      data: { processingStatus: "Processed", processedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
