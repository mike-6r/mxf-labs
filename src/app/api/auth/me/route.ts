import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { isAdminDiscordId } from "@/lib/auth/discord-owner-admin";

export async function GET() {
  const [customer, admin] = await Promise.all([getCurrentCustomer(), getCurrentAdmin()]);

  if (!customer) {
    return NextResponse.json({
      ok: true,
      authenticated: false,
      customer: null,
      adminAuthenticated: Boolean(admin),
      adminAccess: Boolean(admin),
    });
  }

  const adminAccess = Boolean(admin) || isAdminDiscordId(customer.discordId);

  return NextResponse.json({
    ok: true,
    authenticated: true,
    adminAuthenticated: Boolean(admin),
    adminAccess,
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
