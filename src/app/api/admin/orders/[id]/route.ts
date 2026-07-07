import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { auditChanges, requestAuditContext } from "@/lib/db/audit";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { fulfillPaidOrder } from "@/lib/payments/fulfillment";
import { orderUpdateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("orders.manage");

  if (response) return response;

  const parsed = orderUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid order update." }, { status: 400 });
  }

  const { id } = await params;
  const before = await prisma.order.findUnique({ where: { id } });
  const order = await prisma.order.update({
    where: { id },
    data: {
      customerId: parsed.data.customerId === undefined ? undefined : parsed.data.customerId || null,
      productId: parsed.data.productId === undefined ? undefined : parsed.data.productId || null,
      status: parsed.data.status,
      amountCents: parsed.data.amountCents,
      taxCents: parsed.data.taxCents,
      currency: parsed.data.currency?.toUpperCase(),
      purchaseIntentId:
        parsed.data.purchaseIntentId === undefined ? undefined : parsed.data.purchaseIntentId || null,
      notes: parsed.data.notes,
    },
    include: { customer: true, product: true },
  });

  await logActivity({
    actorEmail: admin.email,
    action: "updated order",
    entityType: "Order",
    entityId: order.id,
    metadata: {
      status: order.status,
      changes: auditChanges(before as Record<string, unknown> | null, order as unknown as Record<string, unknown>, [
        "customerId",
        "productId",
        "status",
        "amountCents",
        "taxCents",
        "currency",
        "purchaseIntentId",
        "notes",
      ]),
      ...requestAuditContext(request),
    },
  });

  if (["Paid", "Fulfilled"].includes(order.status)) {
    await fulfillPaidOrder(order.id);
  }

  return NextResponse.json({ ok: true, order });
}

export async function DELETE(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("orders.manage");

  if (response) return response;

  const { id } = await params;
  await prisma.order.delete({ where: { id } });

  await logActivity({
    actorEmail: admin.email,
    action: "deleted order",
    entityType: "Order",
    entityId: id,
    metadata: requestAuditContext(request),
  });

  return NextResponse.json({ ok: true });
}
