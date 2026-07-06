import { createHash, createHmac, randomUUID, timingSafeEqual } from "crypto";

const DEFAULT_LEASE_TTL_SECONDS = 15 * 60;
const DEFAULT_OFFLINE_GRACE_SECONDS = 6 * 60 * 60;
const DEFAULT_HEARTBEAT_SECONDS = 5 * 60;

function envNumber(name: string, fallback: number, minimum: number, maximum: number) {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : Number.NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.floor(parsed)));
}

function signingSecret() {
  return process.env.LICENSE_SIGNING_SECRET || process.env.AUTH_SECRET || "mxf-labs-local-license-secret";
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", signingSecret()).update(encodedPayload).digest("base64url");
}

export function licenseKeyFingerprint(key: string) {
  return createHash("sha256").update(key).digest("hex").slice(0, 16);
}

export function maskLicenseKey(key?: string | null) {
  if (!key) return null;
  const parts = key.split("-");
  if (parts.length < 3) return `${key.slice(0, 4)}...${key.slice(-4)}`;
  return `${parts[0]}-${parts[1]}-...-${parts.at(-1)}`;
}

export function licenseReasonCode(reason: string) {
  return reason.toUpperCase().replaceAll("-", "_");
}

export function licenseReasonMessage(reason: string) {
  const messages: Record<string, string> = {
    valid: "License is valid.",
    invalid_key: "License key was not found.",
    product_mismatch: "License is not assigned to this product.",
    suspicious_activity: "License requires manual review.",
    expired: "License has expired.",
    revoked: "License has been revoked.",
    suspended: "License has been suspended.",
    hwid_mismatch: "Device binding does not match the active activation.",
    ip_mismatch: "IP binding does not match the active activation.",
    activation_limit_reached: "Activation limit has been reached.",
    version_blocked: "This product version is not allowed by the license policy.",
  };

  return messages[reason] || "License check completed.";
}

export type LicenseLeaseInput = {
  licenseId: string;
  key: string;
  valid: boolean;
  reason: string;
  status?: string | null;
  licenseType?: string | null;
  productId?: string | null;
  productSlug?: string | null;
  customerId?: string | null;
  activationId?: string | null;
  deviceId?: string | null;
  instanceId?: string | null;
  currentActivations?: number | null;
  maxActivations?: number | null;
};

export function createLicenseLease(input: LicenseLeaseInput) {
  const ttlSeconds = envNumber("LICENSE_LEASE_TTL_SECONDS", DEFAULT_LEASE_TTL_SECONDS, 60, 86_400);
  const offlineGraceSeconds = envNumber("LICENSE_OFFLINE_GRACE_SECONDS", DEFAULT_OFFLINE_GRACE_SECONDS, 0, 604_800);
  const issuedAtSeconds = Math.floor(Date.now() / 1000);
  const expiresAtSeconds = issuedAtSeconds + ttlSeconds;
  const payload = {
    typ: "mxf-license-lease",
    v: 1,
    jti: randomUUID(),
    sub: input.licenseId,
    keyFingerprint: licenseKeyFingerprint(input.key),
    valid: input.valid,
    reason: input.reason,
    code: licenseReasonCode(input.reason),
    status: input.status || null,
    licenseType: input.licenseType || null,
    productId: input.productId || null,
    productSlug: input.productSlug || null,
    customerId: input.customerId || null,
    activationId: input.activationId || null,
    deviceId: input.deviceId || null,
    instanceId: input.instanceId || null,
    activations: {
      current: input.currentActivations || 0,
      max: input.maxActivations || 0,
    },
    iat: issuedAtSeconds,
    exp: expiresAtSeconds,
  };
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return {
    token: `${encodedPayload}.${signature}`,
    issuedAt: new Date(issuedAtSeconds * 1000).toISOString(),
    expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
    ttlSeconds,
    offlineGraceSeconds,
    payload,
  };
}

export function verifyLicenseLease(token: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expected, "base64url");
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as { exp?: number };
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export function runtimeLicensePolicy() {
  return {
    heartbeatSeconds: envNumber("LICENSE_HEARTBEAT_SECONDS", DEFAULT_HEARTBEAT_SECONDS, 60, 86_400),
    leaseTtlSeconds: envNumber("LICENSE_LEASE_TTL_SECONDS", DEFAULT_LEASE_TTL_SECONDS, 60, 86_400),
    offlineGraceSeconds: envNumber("LICENSE_OFFLINE_GRACE_SECONDS", DEFAULT_OFFLINE_GRACE_SECONDS, 0, 604_800),
  };
}
