import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { fulfillPaidOrder } from "@/lib/payments/fulfillment";
import { orderCreateSchema } from "@/lib/validation/schemas";

export async function GET() {
  const { response } = await requireAdminApi("orders.manage");

  if (response) return response;

  const orders = await prisma.order.findMany({
    include: { customer: true, product: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, orders });
}

export async function POST(request: Request) {
  const { admin, response } = await requireAdminApi("orders.manage");

  if (response) return response;

  const parsed = orderCreateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid order." }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      customerId: parsed.data.customerId || null,
      productId: parsed.data.productId || null,
      status: parsed.data.status,
      amountCents: parsed.data.amountCents,
      taxCents: parsed.data.taxCents,
      currency: parsed.data.currency.toUpperCase(),
      purchaseIntentId: parsed.data.purchaseIntentId || null,
      notes: parsed.data.notes || "",
    },
    include: { customer: true, product: true },
  });

  await logActivity({
    actorEmail: admin.email,
    action: "created order",
    entityType: "Order",
    entityId: order.id,
    metadata: { status: order.status, amountCents: order.amountCents },
  });

  if (["Paid", "Fulfilled"].includes(order.status)) {
    await fulfillPaidOrder(order.id);
  }

  return NextResponse.json({ ok: true, order }, { status: 201 });
}
