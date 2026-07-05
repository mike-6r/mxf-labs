import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth/customer";
import {
  createOAuthStateValue,
  DISCORD_OAUTH_STATE_COOKIE,
  OAUTH_STATE_MAX_AGE_SECONDS,
} from "@/lib/auth/session";
import { discordAuthorizeUrl, discordConfigured } from "@/lib/auth/discord";
import { safeRelativeRedirectTarget } from "@/lib/auth/redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "link" ? "link" : "login";
  const returnTo = safeRelativeRedirectTarget(url.searchParams.get("returnTo"), mode === "link" ? "/portal/settings/discord" : "/portal");
  const customer = await getCurrentCustomer();

  if (!discordConfigured()) {
    const fallback = new URL(returnTo, request.url);
    fallback.searchParams.set("status", "discord_not_configured");
    return NextResponse.redirect(fallback);
  }

  const state = await createOAuthStateValue({
    mode,
    returnTo,
    customerId: customer?.id || null,
  });
  const response = NextResponse.redirect(discordAuthorizeUrl({ state, requestUrl: request.url }));

  response.cookies.set(DISCORD_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });

  return response;
}
