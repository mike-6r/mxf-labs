import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createLicenseRuntimeResponse, evaluateLicense, evaluateSuspiciousActivity, recordLicenseValidation } from "@/lib/license/server";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request/ip";
import { licenseValidationSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const ipAddress = requestIp(request);
  const rate = checkRateLimit(`license:${ipAddress}`, 60);

  if (!rate.ok) {
    return rateLimitedResponse("Rate limited.", rate, { valid: false });
  }

  const parsed = licenseValidationSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, valid: false, message: "Invalid request." }, { status: 400 });
  }

  const evaluation = await evaluateLicense({
    key: parsed.data.key,
    productSlug: parsed.data.productSlug,
    productVersion: parsed.data.productVersion,
    deviceId: parsed.data.deviceId,
    instanceId: parsed.data.instanceId || parsed.data.activationId,
    ipAddress,
    discordId: parsed.data.discordId,
  });

  await recordLicenseValidation({
    key: parsed.data.key,
    licenseId: evaluation.license?.id,
    productId: evaluation.license?.productId,
    result: evaluation.valid ? "valid" : "failed",
    reason: evaluation.reason,
    deviceId: parsed.data.deviceId,
    instanceId: parsed.data.instanceId || parsed.data.activationId,
    discordId: parsed.data.discordId,
    ipAddress,
    productVersion: parsed.data.productVersion,
  });

  await evaluateSuspiciousActivity({
    licenseId: evaluation.license?.id,
    key: parsed.data.key,
    customerId: evaluation.license?.customerId,
    productId: evaluation.license?.productId,
    reason: evaluation.reason,
    deviceId: parsed.data.deviceId,
    instanceId: parsed.data.instanceId || parsed.data.activationId,
    discordId: parsed.data.discordId,
    ipAddress,
  });

  if (evaluation.license) {
    await prisma.license.update({
      where: { id: evaluation.license.id },
      data: { lastValidatedAt: new Date() },
    });
  }

  return NextResponse.json(
    createLicenseRuntimeResponse({
      evaluation,
      key: parsed.data.key,
      deviceId: parsed.data.deviceId,
      instanceId: parsed.data.instanceId || parsed.data.activationId,
      activationId: parsed.data.activationId,
    }),
  );
}
