export type DiscordProfile = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  email?: string | null;
  verified?: boolean;
};

export function discordConfigured() {
  return Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
}

export function discordRedirectUri(requestUrl: string) {
  const requestOrigin = new URL(requestUrl).origin;
  const siteOrigin = originFrom(process.env.NEXT_PUBLIC_SITE_URL);
  const fallbackOrigin = siteOrigin || requestOrigin;
  const configuredRedirect = process.env.DISCORD_REDIRECT_URI?.trim();

  if (configuredRedirect) {
    const configuredOrigin = originFrom(configuredRedirect);
    const configuredIsLocal = configuredOrigin ? isLocalOrigin(configuredOrigin) : configuredRedirect.includes("localhost");
    const fallbackIsLocal = isLocalOrigin(fallbackOrigin);

    if (!configuredIsLocal || fallbackIsLocal) {
      return configuredRedirect;
    }
  }

  return `${fallbackOrigin}/api/auth/discord/callback`;
}

export function discordAuthorizeUrl({
  state,
  requestUrl,
}: {
  state: string;
  requestUrl: string;
}) {
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID || "");
  url.searchParams.set("redirect_uri", discordRedirectUri(requestUrl));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify email");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "consent");
  return url;
}

export async function exchangeDiscordCode({
  code,
  requestUrl,
}: {
  code: string;
  requestUrl: string;
}) {
  const body = new URLSearchParams();
  body.set("client_id", process.env.DISCORD_CLIENT_ID || "");
  body.set("client_secret", process.env.DISCORD_CLIENT_SECRET || "");
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("redirect_uri", discordRedirectUri(requestUrl));

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Discord token exchange failed.");
  }

  return (await response.json()) as { access_token: string; token_type: string; expires_in: number };
}

export async function fetchDiscordProfile(accessToken: string) {
  const response = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Discord profile fetch failed.");
  }

  return (await response.json()) as DiscordProfile;
}

export function discordAvatarUrl(profile: DiscordProfile) {
  if (!profile.avatar) {
    return null;
  }

  const extension = profile.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${extension}`;
}

function originFrom(value?: string | null) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(origin: string) {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return origin.includes("localhost") || origin.includes("127.0.0.1");
  }
}
