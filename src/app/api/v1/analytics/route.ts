import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) return response;

  const [customers, orders, licenses, validations, downloads, supportTickets] = await Promise.all([
    prisma.customer.count(),
    prisma.order.findMany(),
    prisma.license.count(),
    prisma.licenseValidation.count(),
    prisma.downloadEvent.count(),
    prisma.supportTicket.count(),
  ]);

  return NextResponse.json({
    ok: true,
    analytics: {
      customers,
      orders: orders.length,
      revenueCents: orders.reduce((total, order) => total + order.amountCents - order.discountCents, 0),
      licenses,
      validations,
      downloads,
      supportTickets,
    },
  });
}
