const API_BASE_URL = process.env.MXF_LICENSE_API_URL || "https://mxf-labs.com";
const LICENSE_KEY = process.env.MXF_LICENSE_KEY;
const PRODUCT_SLUG = process.env.MXF_PRODUCT_SLUG || "mxf-factions";
const PRODUCT_VERSION = process.env.MXF_PRODUCT_VERSION || "1.0.0";
const DEVICE_ID = process.env.MXF_DEVICE_ID || `${process.platform}-${process.arch}`;
const INSTANCE_ID = process.env.MXF_INSTANCE_ID || "server-1";

async function licenseRequest(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || `License API failed with HTTP ${response.status}`);
  }

  return payload;
}

async function activateLicense() {
  return licenseRequest("/api/v1/licenses/activate", {
    key: LICENSE_KEY,
    productSlug: PRODUCT_SLUG,
    productVersion: PRODUCT_VERSION,
    deviceId: DEVICE_ID,
    instanceId: INSTANCE_ID,
  });
}

async function validateLicense() {
  return licenseRequest("/api/v1/licenses/validate", {
    key: LICENSE_KEY,
    productSlug: PRODUCT_SLUG,
    productVersion: PRODUCT_VERSION,
    deviceId: DEVICE_ID,
    instanceId: INSTANCE_ID,
  });
}

async function heartbeat() {
  return licenseRequest("/api/v1/licenses/heartbeat", {
    key: LICENSE_KEY,
    productSlug: PRODUCT_SLUG,
    productVersion: PRODUCT_VERSION,
    deviceId: DEVICE_ID,
    instanceId: INSTANCE_ID,
  });
}

if (!LICENSE_KEY) {
  throw new Error("Set MXF_LICENSE_KEY before running this example.");
}

const activation = await activateLicense();
if (!activation.activated) {
  throw new Error(`License activation blocked: ${activation.code} / ${activation.message}`);
}

console.log("Activated", {
  activationId: activation.activationId,
  status: activation.status,
  product: activation.product,
  leaseExpiresAt: activation.lease?.expiresAt,
  nextHeartbeatSeconds: activation.policy?.heartbeatSeconds,
});

const validation = await validateLicense();
if (!validation.valid) {
  throw new Error(`License validation blocked: ${validation.code} / ${validation.message}`);
}

console.log("Validated", {
  keyFingerprint: validation.license?.keyFingerprint,
  activations: validation.activations,
  offlineGraceSeconds: validation.lease?.offlineGraceSeconds,
});

setInterval(async () => {
  try {
    const result = await heartbeat();
    if (!result.alive) {
      console.error("License heartbeat failed", result.code, result.message);
      process.exitCode = 1;
    } else {
      console.log("Heartbeat ok", result.serverTime);
    }
  } catch (error) {
    console.warn("Heartbeat unreachable; keep a short offline grace window only.", error);
  }
}, (activation.policy?.heartbeatSeconds || 300) * 1000);
