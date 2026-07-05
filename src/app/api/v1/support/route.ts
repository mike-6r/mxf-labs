import { NextResponse } from "next/server";
import { requireCustomerApi } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";

export { POST } from "@/app/api/support/route";

export async function GET() {
  const { customer, response } = await requireCustomerApi();
  if (response) return response;

  const tickets = await prisma.supportTicket.findMany({
    where: { customerId: customer.id },
    include: { relatedProduct: true, relatedLicense: true, notes: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, tickets });
}
