import { NextResponse } from "next/server";
import { requireCustomerApi } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const { customer, response } = await requireCustomerApi();
  if (response) return response;

  const servers = await prisma.discordServer.findMany({
    where: { linkedCustomerId: customer.id },
    include: { product: true, linkedLicense: true },
  });

  return NextResponse.json({
    ok: true,
    discord: {
      id: customer.discordId,
      username: customer.discordUsername,
      globalName: customer.discordGlobalName,
      syncStatus: customer.discordSyncStatus,
      lastSyncedAt: customer.discordLastSyncedAt,
      servers,
    },
  });
}
