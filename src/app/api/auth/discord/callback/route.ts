import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createCustomerSession, setCustomerSessionCookie } from "@/lib/auth/customer";
import { discordAvatarUrl, exchangeDiscordCode, fetchDiscordProfile } from "@/lib/auth/discord";
import { DISCORD_OAUTH_STATE_COOKIE, verifyOAuthStateValue } from "@/lib/auth/session";
import { safeRelativeRedirectTarget } from "@/lib/auth/redirect";
import { logCustomerActivity } from "@/lib/db/customer-activity";
import { prisma } from "@/lib/db/prisma";
import { sendTemplateEmail } from "@/lib/email/resend";
import { requestIp } from "@/lib/request/ip";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get(DISCORD_OAUTH_STATE_COOKIE)?.value;
  const statePayload = await verifyOAuthStateValue(state);

  if (!code || !state || !storedState || storedState !== state || !statePayload) {
    return NextResponse.redirect(new URL("/portal?status=discord_state_invalid", request.url));
  }

  try {
    const token = await exchangeDiscordCode({ code, requestUrl: request.url });
    const profile = await fetchDiscordProfile(token.access_token);
    const email = profile.email || `${profile.id}@discord.mxf-labs.local`;
    const existing =
      (await prisma.customer.findFirst({ where: { discordId: profile.id } })) ||
      (await prisma.customer.findUnique({ where: { email } }));

    const customer = existing
      ? await prisma.customer.update({
          where: { id: existing.id },
          data: {
            email,
            name: profile.global_name || profile.username,
            discordId: profile.id,
            discordUsername: profile.username,
            discordGlobalName: profile.global_name || profile.username,
            discordAvatar: discordAvatarUrl(profile),
            discordEmail: profile.email || null,
            discordLinkedAt: existing.discordLinkedAt || new Date(),
            discordLastSyncedAt: new Date(),
            discordSyncStatus: "Connected",
          },
        })
      : await prisma.customer.create({
          data: {
            email,
            name: profile.global_name || profile.username,
            discordId: profile.id,
            discordUsername: profile.username,
            discordGlobalName: profile.global_name || profile.username,
            discordAvatar: discordAvatarUrl(profile),
            discordEmail: profile.email || null,
            discordLinkedAt: new Date(),
            discordLastSyncedAt: new Date(),
            discordSyncStatus: "Connected",
          },
        });

    await logCustomerActivity({
      customerId: customer.id,
      action: statePayload.mode === "link" ? "linked Discord account" : "logged in with Discord",
      entityType: "Customer",
      entityId: customer.id,
      metadata: { discordId: profile.id },
    });

    await prisma.customerLoginEvent.create({
      data: {
        customerId: customer.id,
        provider: "Discord",
        ipAddress: requestIp(request),
        userAgent: request.headers.get("user-agent"),
        status: "Success",
      },
    });

    if (!existing && profile.email) {
      await Promise.all([
        sendTemplateEmail({ to: profile.email, template: "account_created", data: { customerName: customer.name } }),
        sendTemplateEmail({ to: profile.email, template: "welcome", data: { customerName: customer.name } }),
      ]);
    }

    const sessionValue = await createCustomerSession(customer);
    const redirect = NextResponse.redirect(new URL(safeRelativeRedirectTarget(statePayload.returnTo, "/portal"), request.url));
    setCustomerSessionCookie(redirect, sessionValue);
    redirect.cookies.delete(DISCORD_OAUTH_STATE_COOKIE);
    return redirect;
  } catch {
    return NextResponse.redirect(new URL("/portal?status=discord_oauth_failed", request.url));
  }
}
