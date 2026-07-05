import { NextResponse } from "next/server";

export function requireDiscordBot(request: Request) {
  const configuredKeys = [process.env.MXF_BOT_API_KEY, process.env.DISCORD_BOT_API_KEY]
    .map((key) => key?.trim())
    .filter((key): key is string => Boolean(key && key !== "replace-with-a-private-bot-api-key"));
  const providedKey =
    request.headers.get("x-api-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!configuredKeys.length) {
    return NextResponse.json(
      { ok: false, message: "MXF_BOT_API_KEY or DISCORD_BOT_API_KEY is not configured." },
      { status: 503 },
    );
  }

  if (!providedKey || !configuredKeys.includes(providedKey)) {
    return NextResponse.json({ ok: false, message: "Unauthorized bot request." }, { status: 401 });
  }

  return null;
}
