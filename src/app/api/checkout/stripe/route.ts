import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";
import { fulfillPaidOrder } from "@/lib/payments/fulfillment";
import { mockPaymentsEnabled, paymentProviderConfigured } from "@/lib/payments/readiness";
import { createStripeCheckoutSession } from "@/lib/payments/stripe";
import { isLiveProductStatus } from "@/lib/products/status";
import { checkoutSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid checkout request." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { slug: parsed.data.productSlug } });

  if (!product || !product.visible || !isLiveProductStatus(product.status) || product.priceCents <= 0 || !paymentProviderConfigured("stripe")) {
    return NextResponse.json({ ok: false, message: "Product is not available for checkout." }, { status: 404 });
  }

  const currentCustomer = await getCurrentCustomer();
  const customerEmail = currentCustomer?.email || parsed.data.customerEmail;

  if (!customerEmail) {
    return NextResponse.json({ ok: false, message: "Customer email is required." }, { status: 400 });
  }

  const customer = currentCustomer || (await prisma.customer.upsert({
    where: { email: customerEmail },
    update: { name: parsed.data.customerName || customerEmail },
    create: { email: customerEmail, name: parsed.data.customerName || customerEmail },
  }));

  const origin = new URL(request.url).origin;
  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      productId: product.id,
      status: "Checkout Created",
      provider: "Stripe",
      amountCents: product.priceCents,
      currency: product.currency,
      couponCode: parsed.data.couponCode || null,
      notes: "Stripe Checkout Session created.",
    },
  });

  if (mockPaymentsEnabled()) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "Paid",
        providerOrderId: `mock_stripe_${order.id}`,
        checkoutUrl: `${origin}/portal?checkout=mock_stripe_success&orderId=${order.id}`,
        notes: "Mock Stripe checkout completed locally.",
      },
    });
    await fulfillPaidOrder(order.id);
    return NextResponse.json({
      ok: true,
      mocked: true,
      orderId: order.id,
      checkoutUrl: `${origin}/portal?checkout=mock_stripe_success&orderId=${order.id}`,
    });
  }

  try {
    const session = await createStripeCheckoutSession({
      orderId: order.id,
      productName: product.name,
      productSlug: product.slug,
      amountCents: product.priceCents,
      currency: product.currency,
      customerEmail,
      successUrl: parsed.data.successUrl || `${origin}/portal?checkout=stripe_success`,
      cancelUrl: parsed.data.cancelUrl || `${origin}/products/${product.slug}?checkout=canceled`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { providerOrderId: session.id, checkoutUrl: session.url },
    });

    return NextResponse.json({ ok: true, orderId: order.id, checkoutUrl: session.url });
  } catch (error) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "Checkout Failed", notes: error instanceof Error ? error.message : "Stripe checkout failed." },
    });
    return NextResponse.json({ ok: false, message: "Stripe checkout is not configured or failed." }, { status: 503 });
  }
}
