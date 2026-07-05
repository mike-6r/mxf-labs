import { NextResponse } from "next/server";
import { requireDiscordBot } from "@/lib/auth/bot";
import { evaluateLicense } from "@/lib/license/server";
import { botLicenseSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const unauthorized = requireDiscordBot(request);
  if (unauthorized) return unauthorized;

  const parsed = botLicenseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid license payload." }, { status: 400 });
  }

  const evaluation = await evaluateLicense({ key: parsed.data.key, productSlug: parsed.data.productSlug });
  const ownershipMatches =
    !parsed.data.discordId || evaluation.license?.customer?.discordId === parsed.data.discordId;

  return NextResponse.json({
    ok: true,
    valid: evaluation.valid && ownershipMatches,
    reason: ownershipMatches ? evaluation.reason : "discord_owner_mismatch",
    product: evaluation.license?.product?.slug,
    customerDiscordId: evaluation.license?.customer?.discordId,
  });
}
