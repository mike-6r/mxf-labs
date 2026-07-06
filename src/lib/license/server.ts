import { prisma } from "@/lib/db/prisma";
import { getBooleanSetting, getNumberSetting } from "@/lib/db/settings";
import { isLicenseUsable, normalizeLicenseReason, parseAllowedVersions, versionIsAllowed, versionMeetsMinimum } from "@/lib/license/generate";
import { createLicenseLease, licenseKeyFingerprint, licenseReasonCode, licenseReasonMessage, maskLicenseKey, runtimeLicensePolicy } from "@/lib/license/lease";

export async function evaluateLicense({
  key,
  productSlug,
  productVersion,
  deviceId,
  instanceId,
  ipAddress,
  discordId,
}: {
  key: string;
  productSlug?: string;
  productVersion?: string;
  deviceId?: string | null;
  instanceId?: string | null;
  ipAddress?: string | null;
  discordId?: string | null;
}) {
  const license = await prisma.license.findUnique({
    where: { key },
    include: { product: true, customer: true, activations: { where: { status: "Active" } } },
  });

  if (!license) {
    return {
      license: null,
      valid: false,
      reason: "invalid_key",
      productMatches: false,
      usable: false,
      activationAllowed: false,
      versionAllowed: false,
    };
  }

  const productMatches = !productSlug || !license.product || license.product.slug === productSlug;
  const usable = isLicenseUsable(license.status, license.expirationDate);
  const matchingActivation = deviceId && instanceId
    ? license.activations.find((activation) => activation.deviceId === deviceId && activation.instanceId === instanceId)
    : null;
  const hwidConflict = deviceId && instanceId
    ? license.activations.find((activation) => activation.instanceId === instanceId && activation.deviceId !== deviceId)
    : null;
  const strictIpBinding = await getBooleanSetting("security.strict_ip_binding");
  const ipConflict = Boolean(
    strictIpBinding &&
      ipAddress &&
      matchingActivation?.ipAddress &&
      matchingActivation.ipAddress !== ipAddress,
  );
  const discordMismatch = Boolean(discordId && license.customer?.discordId && discordId !== license.customer.discordId);
  const activationAllowed = Boolean(matchingActivation) || license.activations.length < license.maxActivations;
  const versionAllowed = versionMeetsMinimum(productVersion, license.minimumVersion) && versionIsAllowed(productVersion, license.allowedVersionsJson);
  const reason = normalizeLicenseReason({
    exists: true,
    productMatches,
    usable,
    activationAllowed,
    versionAllowed,
    hwidMatches: !hwidConflict,
    ipMatches: !ipConflict,
    suspicious: discordMismatch,
    status: license.status,
    blacklisted: license.blacklisted,
  });

  return {
    license,
    valid: reason === "valid",
    reason,
    productMatches,
    usable,
    activationAllowed,
    versionAllowed,
    hwidConflict,
    ipConflict,
    discordMismatch,
  };
}

export function createLicenseRuntimeResponse({
  evaluation,
  key,
  deviceId,
  instanceId,
  activationId,
}: {
  evaluation: Awaited<ReturnType<typeof evaluateLicense>>;
  key: string;
  deviceId?: string | null;
  instanceId?: string | null;
  activationId?: string | null;
}) {
  const license = evaluation.license;
  const policy = runtimeLicensePolicy();
  const lease = license
    ? createLicenseLease({
        licenseId: license.id,
        key,
        valid: evaluation.valid,
        reason: evaluation.reason,
        status: license.status,
        licenseType: license.licenseType,
        productId: license.productId,
        productSlug: license.product?.slug,
        customerId: license.customerId,
        activationId,
        deviceId,
        instanceId,
        currentActivations: license.currentActivations,
        maxActivations: license.maxActivations,
      })
    : null;

  return {
    ok: true,
    valid: evaluation.valid,
    code: licenseReasonCode(evaluation.reason),
    reason: evaluation.reason,
    message: licenseReasonMessage(evaluation.reason),
    serverTime: new Date().toISOString(),
    status: license?.status,
    product: license?.product?.slug,
    customer: license?.customer?.email,
    license: license
      ? {
          id: license.id,
          keyMasked: maskLicenseKey(license.key),
          keyFingerprint: licenseKeyFingerprint(license.key),
          status: license.status,
          type: license.licenseType,
          expiresAt: license.expirationDate,
          blacklisted: license.blacklisted,
          minimumVersion: license.minimumVersion,
          allowedVersions: parseAllowedVersions(license.allowedVersionsJson),
        }
      : null,
    productInfo: license?.product
      ? {
          id: license.product.id,
          slug: license.product.slug,
          name: license.product.name,
          version: license.product.version,
        }
      : null,
    customerInfo: license?.customer
      ? {
          id: license.customer.id,
          email: license.customer.email,
          discordId: license.customer.discordId,
        }
      : null,
    activation: {
      id: activationId || null,
      deviceId: deviceId || null,
      instanceId: instanceId || null,
      allowed: evaluation.activationAllowed,
      productMatches: evaluation.productMatches,
      versionAllowed: evaluation.versionAllowed,
    },
    activations: {
      current: license?.currentActivations || 0,
      max: license?.maxActivations || 0,
    },
    policy,
    lease: lease
      ? {
          token: lease.token,
          issuedAt: lease.issuedAt,
          expiresAt: lease.expiresAt,
          ttlSeconds: lease.ttlSeconds,
          offlineGraceSeconds: lease.offlineGraceSeconds,
        }
      : null,
  };
}

export async function recordLicenseValidation({
  key,
  licenseId,
  productId,
  result,
  reason,
  deviceId,
  instanceId,
  discordId,
  ipAddress,
  country,
  productVersion,
}: {
  key: string;
  licenseId?: string | null;
  productId?: string | null;
  result: string;
  reason: string;
  deviceId?: string | null;
  instanceId?: string | null;
  discordId?: string | null;
  ipAddress?: string | null;
  country?: string | null;
  productVersion?: string | null;
}) {
  return prisma.licenseValidation.create({
    data: {
      key,
      licenseId,
      productId,
      result,
      reason,
      deviceId,
      instanceId,
      discordId,
      ipAddress,
      country,
      productVersion,
    },
  });
}

export async function flagIfMissing({
  reason,
  severity,
  customerId,
  licenseId,
  productId,
  metadata,
}: {
  reason: string;
  severity: string;
  customerId?: string | null;
  licenseId?: string | null;
  productId?: string | null;
  metadata: Record<string, unknown>;
}) {
  const existing = await prisma.suspiciousActivityFlag.findFirst({
    where: {
      reason,
      status: "Open",
      ...(licenseId ? { licenseId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(productId ? { productId } : {}),
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.suspiciousActivityFlag.create({
    data: {
      reason,
      severity,
      customerId,
      licenseId,
      productId,
      metadata: JSON.stringify(metadata),
    },
  });
}

export async function evaluateSuspiciousActivity({
  licenseId,
  key,
  customerId,
  productId,
  reason,
  deviceId,
  instanceId,
  discordId,
  ipAddress,
  country,
}: {
  licenseId?: string | null;
  key: string;
  customerId?: string | null;
  productId?: string | null;
  reason: string;
  deviceId?: string | null;
  instanceId?: string | null;
  discordId?: string | null;
  ipAddress?: string | null;
  country?: string | null;
}) {
  const [maxFailed, maxHwids, maxIps] = await Promise.all([
    getNumberSetting("security.max_failed_validations"),
    getNumberSetting("security.max_distinct_hwids"),
    getNumberSetting("security.max_distinct_ips"),
  ]);

  if (!licenseId) {
    const failedUnknown = await prisma.licenseValidation.count({
      where: { key, result: "failed" },
    });

    if (failedUnknown >= maxFailed) {
      await flagIfMissing({
        reason: "too_many_failed_validations",
        severity: "High",
        customerId,
        productId,
        metadata: { key, failedUnknown, threshold: maxFailed },
      });
    }

    return;
  }

  const since24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [failedValidations, activeActivations, distinctDevices, distinctIps, distinctDiscordIds, distinctCountries] = await Promise.all([
    prisma.licenseValidation.count({ where: { licenseId, result: "failed" } }),
    prisma.licenseActivation.count({ where: { licenseId, status: "Active" } }),
    prisma.licenseActivation.findMany({
      where: { licenseId },
      select: { deviceId: true },
      distinct: ["deviceId"],
    }),
    prisma.licenseValidation.findMany({
      where: { licenseId, ipAddress: { not: null } },
      select: { ipAddress: true },
      distinct: ["ipAddress"],
    }),
    prisma.licenseValidation.findMany({
      where: { licenseId, discordId: { not: null } },
      select: { discordId: true },
      distinct: ["discordId"],
    }),
    prisma.licenseValidation.findMany({
      where: { licenseId, country: { not: null }, createdAt: { gte: since24Hours } },
      select: { country: true },
      distinct: ["country"],
    }),
  ]);

  if (failedValidations >= maxFailed) {
    await flagIfMissing({
      reason: "too_many_failed_validations",
      severity: "High",
      customerId,
      licenseId,
      productId,
      metadata: { failedValidations, key, threshold: maxFailed },
    });
  }

  if (reason === "activation_limit_reached" || activeActivations >= 4) {
    await flagIfMissing({
      reason: "too_many_activations",
      severity: "Review",
      customerId,
      licenseId,
      productId,
      metadata: { activeActivations, key },
    });
  }

  if (reason === "hwid_mismatch") {
    await flagIfMissing({
      reason: "hwid_mismatch",
      severity: "High",
      customerId,
      licenseId,
      productId,
      metadata: { deviceId, instanceId, key },
    });
  }

  if (reason === "ip_mismatch") {
    await flagIfMissing({
      reason: "ip_mismatch",
      severity: "Review",
      customerId,
      licenseId,
      productId,
      metadata: { ipAddress, key },
    });
  }

  if (distinctDevices.length >= maxHwids) {
    await flagIfMissing({
      reason: "too_many_hwids",
      severity: "Review",
      customerId,
      licenseId,
      productId,
      metadata: { devices: distinctDevices.length, key, threshold: maxHwids },
    });
  }

  if (distinctIps.length >= maxIps) {
    await flagIfMissing({
      reason: "too_many_ips",
      severity: "Review",
      customerId,
      licenseId,
      productId,
      metadata: { ips: distinctIps.length, key, threshold: maxIps },
    });

    await flagIfMissing({
      reason: "possible_vpn_or_proxy_abuse",
      severity: "Review",
      customerId,
      licenseId,
      productId,
      metadata: { ips: distinctIps.length, key, threshold: maxIps },
    });
  }

  if (distinctDiscordIds.length > 1 || reason === "suspicious_activity") {
    await flagIfMissing({
      reason: "different_discord_users",
      severity: "High",
      customerId,
      licenseId,
      productId,
      metadata: { discordIds: distinctDiscordIds.map((item) => item.discordId), discordId, key },
    });
  }

  if (distinctCountries.length >= 3) {
    await flagIfMissing({
      reason: "impossible_travel",
      severity: "High",
      customerId,
      licenseId,
      productId,
      metadata: { countries: distinctCountries.map((item) => item.country), country, key },
    });
  }
}

export async function evaluateDownloadActivity({
  customerId,
  productId,
  downloadId,
  ipAddress,
}: {
  customerId?: string | null;
  productId?: string | null;
  downloadId?: string | null;
  ipAddress?: string | null;
}) {
  if (!customerId) return;

  const maxDownloadsPerHour = await getNumberSetting("security.max_downloads_per_hour");
  const sinceOneHour = new Date(Date.now() - 60 * 60 * 1000);
  const recentDownloads = await prisma.downloadEvent.count({
    where: {
      customerId,
      status: "Allowed",
      createdAt: { gte: sinceOneHour },
      ...(downloadId ? { downloadId } : {}),
    },
  });

  if (recentDownloads >= maxDownloadsPerHour) {
    await flagIfMissing({
      reason: "abnormal_download_activity",
      severity: "Review",
      customerId,
      productId,
      metadata: { downloadId, ipAddress, recentDownloads, threshold: maxDownloadsPerHour },
    });
  }
}
