import { NextResponse } from "next/server";
import { requireCustomerApi } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const { customer, response } = await requireCustomerApi();
  if (response) return response;

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, orders });
}
