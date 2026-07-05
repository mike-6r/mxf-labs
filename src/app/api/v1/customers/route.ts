import { NextResponse } from "next/server";
import { requireCustomerApi } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const { customer, response } = await requireCustomerApi();
  if (response) return response;

  const record = await prisma.customer.findUnique({
    where: { id: customer.id },
    include: { orders: true, licenses: true, supportTickets: true, notifications: true },
  });

  return NextResponse.json({ ok: true, customer: record });
}
