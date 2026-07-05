import { NextResponse } from "next/server";
import { requireCustomerApi } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const { customer, response } = await requireCustomerApi();
  if (response) return response;

  const licenses = await prisma.license.findMany({ where: { customerId: customer.id } });
  const productIds = licenses.map((license) => license.productId).filter((id): id is string => Boolean(id));
  const downloads = await prisma.productDownload.findMany({
    where: { productId: { in: productIds }, visible: true },
    include: { product: true, release: true },
  });

  return NextResponse.json({ ok: true, downloads });
}
