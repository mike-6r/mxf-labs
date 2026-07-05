import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth/customer";

export async function GET() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return NextResponse.json({ ok: true, authenticated: false, customer: null });
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      discordId: customer.discordId,
      discordUsername: customer.discordUsername,
      discordGlobalName: customer.discordGlobalName,
      discordAvatar: customer.discordAvatar,
      discordSyncStatus: customer.discordSyncStatus,
    },
  });
}
