import { NextResponse } from "next/server";
import { createLicenseRuntimeResponse, evaluateLicense, evaluateSuspiciousActivity, recordLicenseValidation } from "@/lib/license/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request/ip";
import { licenseActivationSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const ipAddress = requestIp(request);
  const rate = checkRateLimit(`license-activate:${ipAddress}`, 40);

  if (!rate.ok) {
    return NextResponse.json({ ok: false, activated: false, message: "Rate limited." }, { status: 429 });
  }

  const parsed = licenseActivationSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, activated: false, message: "Invalid activation request." }, { status: 400 });
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
    result: evaluation.valid ? "activated" : "failed",
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
      activated: false,
    });
  }

  const activation = await prisma.licenseActivation.upsert({
    where: {
      licenseId_deviceId_instanceId: {
        licenseId: evaluation.license.id,
        deviceId: parsed.data.deviceId,
        instanceId: parsed.data.instanceId,
      },
    },
    update: {
      status: "Active",
      discordId: parsed.data.discordId || null,
      ipAddress,
      country: parsed.data.country || null,
      productVersion: parsed.data.productVersion || null,
      lastSeenAt: new Date(),
      activationCount: { increment: 1 },
    },
    create: {
      licenseId: evaluation.license.id,
      deviceId: parsed.data.deviceId,
      instanceId: parsed.data.instanceId,
      discordId: parsed.data.discordId || null,
      ipAddress,
      country: parsed.data.country || null,
      productVersion: parsed.data.productVersion || null,
      status: "Active",
    },
  });

  const currentActivations = await prisma.licenseActivation.count({
    where: { licenseId: evaluation.license.id, status: "Active" },
  });

  await prisma.license.update({
    where: { id: evaluation.license.id },
    data: { currentActivations, lastValidatedAt: new Date() },
  });

  return NextResponse.json({
    ...createLicenseRuntimeResponse({
      evaluation: {
        ...evaluation,
        license: {
          ...evaluation.license,
          currentActivations,
        },
      },
      key: parsed.data.key,
      deviceId: parsed.data.deviceId,
      instanceId: parsed.data.instanceId,
      activationId: activation.id,
    }),
    activated: true,
    activationId: activation.id,
  });
}
