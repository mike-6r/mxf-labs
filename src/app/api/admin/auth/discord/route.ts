import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { isAdminDiscordId, setDiscordOwnerAdminSession } from "@/lib/auth/discord-owner-admin";

export async function GET(request: Request) {
  const customer = await getCurrentCustomer();

  if (!customer) {
    const loginUrl = new URL("/api/auth/discord/start", request.url);
    loginUrl.searchParams.set("returnTo", "/api/admin/auth/discord");
    return NextResponse.redirect(loginUrl);
  }

  if (!isAdminDiscordId(customer.discordId)) {
    const portalUrl = new URL("/portal", request.url);
    portalUrl.searchParams.set("status", "admin_discord_required");
    return NextResponse.redirect(portalUrl);
  }

  const response = NextResponse.redirect(new URL("/admin", request.url));
  await setDiscordOwnerAdminSession(response, {
    discordId: customer.discordId,
    email: customer.email,
    name: customer.name,
  });

  return response;
}
