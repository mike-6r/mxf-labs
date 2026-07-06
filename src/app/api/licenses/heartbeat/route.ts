import { NextResponse } from "next/server";
import { createLicenseRuntimeResponse, evaluateLicense, evaluateSuspiciousActivity, recordLicenseValidation } from "@/lib/license/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request/ip";
import { licenseActivationSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const ipAddress = requestIp(request);
  const rate = checkRateLimit(`license-heartbeat:${ipAddress}`, 120);

  if (!rate.ok) {
    return NextResponse.json({ ok: false, message: "Rate limited." }, { status: 429 });
  }

  const parsed = licenseActivationSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid heartbeat request." }, { status: 400 });
  }

  const evaluation = await evaluateLicense({
    key: parsed.data.key,
    productSlug: parsed.data.productSlug,
    productVersion: parsed.data.productVersion,
    deviceId: parsed.data.deviceId,
    instanceId: parsed.data.instanceId,
    ipAddress,
    discordId: parsed.data.discordId,
  });

  await recordLicenseValidation({
    key: parsed.data.key,
    licenseId: evaluation.license?.id,
    productId: evaluation.license?.productId,
    result: evaluation.valid ? "heartbeat" : "failed",
    reason: evaluation.reason,
    deviceId: parsed.data.deviceId,
    instanceId: parsed.data.instanceId,
    discordId: parsed.data.discordId,
    ipAddress,
    country: parsed.data.country,
    productVersion: parsed.data.productVersion,
  });

  await evaluateSuspiciousActivity({
    licenseId: evaluation.license?.id,
    key: parsed.data.key,
    customerId: evaluation.license?.customerId,
    productId: evaluation.license?.productId,
    reason: evaluation.reason,
    deviceId: parsed.data.deviceId,
    instanceId: parsed.data.instanceId,
    discordId: parsed.data.discordId,
    ipAddress,
    country: parsed.data.country,
  });

  if (!evaluation.valid || !evaluation.license) {
    return NextResponse.json({
      ...createLicenseRuntimeResponse({
        evaluation,
        key: parsed.data.key,
        deviceId: parsed.data.deviceId,
        instanceId: parsed.data.instanceId,
      }),
      alive: false,
    });
  }

  const activation = await prisma.licenseActivation.findFirst({
    where: {
      licenseId: evaluation.license.id,
      deviceId: parsed.data.deviceId,
      instanceId: parsed.data.instanceId,
      status: "Active",
    },
    select: { id: true },
  });

  await prisma.licenseActivation.updateMany({
    where: {
      licenseId: evaluation.license.id,
      deviceId: parsed.data.deviceId,
      instanceId: parsed.data.instanceId,
      status: "Active",
    },
    data: {
      ipAddress,
      discordId: parsed.data.discordId || null,
      country: parsed.data.country || null,
      productVersion: parsed.data.productVersion || null,
      lastSeenAt: new Date(),
    },
  });

  await prisma.license.update({ where: { id: evaluation.license.id }, data: { lastValidatedAt: new Date() } });

  return NextResponse.json({
    ...createLicenseRuntimeResponse({
      evaluation,
      key: parsed.data.key,
      deviceId: parsed.data.deviceId,
      instanceId: parsed.data.instanceId,
      activationId: activation?.id,
    }),
    alive: true,
  });
}
