import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";
import { fulfillPaidOrder } from "@/lib/payments/fulfillment";
import { createPayPalOrder } from "@/lib/payments/paypal";
import { mockPaymentsEnabled, paymentProviderConfigured } from "@/lib/payments/readiness";
import { isLiveProductStatus } from "@/lib/products/status";
import { checkoutSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid checkout request." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { slug: parsed.data.productSlug } });

  if (!product || !product.visible || !isLiveProductStatus(product.status) || product.priceCents <= 0 || !paymentProviderConfigured("paypal")) {
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
      provider: "PayPal",
      amountCents: product.priceCents,
      currency: product.currency,
      couponCode: parsed.data.couponCode || null,
      notes: "PayPal order created.",
    },
  });

  if (mockPaymentsEnabled()) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "Paid",
        providerOrderId: `mock_paypal_${order.id}`,
        checkoutUrl: `${origin}/portal?checkout=mock_paypal_success&orderId=${order.id}`,
        notes: "Mock PayPal checkout completed locally.",
      },
    });
    await fulfillPaidOrder(order.id);
    return NextResponse.json({
      ok: true,
      mocked: true,
      orderId: order.id,
      checkoutUrl: `${origin}/portal?checkout=mock_paypal_success&orderId=${order.id}`,
    });
  }

  try {
    const paypalOrder = await createPayPalOrder({
      orderId: order.id,
      productName: product.name,
      amountCents: product.priceCents,
      currency: product.currency,
      successUrl: parsed.data.successUrl || `${origin}/portal?checkout=paypal_success`,
      cancelUrl: parsed.data.cancelUrl || `${origin}/products/${product.slug}?checkout=canceled`,
    });
    const checkoutUrl = paypalOrder.links?.find((link) => link.rel === "approve")?.href || null;

    await prisma.order.update({
      where: { id: order.id },
      data: { providerOrderId: paypalOrder.id, checkoutUrl },
    });

    return NextResponse.json({ ok: true, orderId: order.id, checkoutUrl });
  } catch (error) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "Checkout Failed", notes: error instanceof Error ? error.message : "PayPal checkout failed." },
    });
    return NextResponse.json({ ok: false, message: "PayPal checkout is not configured or failed." }, { status: 503 });
  }
}
