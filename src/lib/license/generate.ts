export function generateLicenseKey(prefix = "MXF") {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomIndexes = new Uint32Array(16);
  crypto.getRandomValues(randomIndexes);
  let index = 0;
  const segment = () => Array.from({ length: 4 }, () => alphabet[randomIndexes[index++] % alphabet.length]).join("");

  return `${prefix}-${segment()}-${segment()}-${segment()}-${segment()}`;
}

export function isLicenseUsable(status: string, expirationDate?: Date | null) {
  if (status !== "Active") {
    return false;
  }

  if (!expirationDate) {
    return true;
  }

  return expirationDate.getTime() > Date.now();
}

export function versionMeetsMinimum(version?: string | null, minimumVersion?: string | null) {
  if (!minimumVersion || !version) {
    return true;
  }

  const current = version.split(".").map((part) => Number(part) || 0);
  const minimum = minimumVersion.split(".").map((part) => Number(part) || 0);
  const length = Math.max(current.length, minimum.length);

  for (let index = 0; index < length; index += 1) {
    const left = current[index] || 0;
    const right = minimum[index] || 0;

    if (left > right) return true;
    if (left < right) return false;
  }

  return true;
}

export function parseAllowedVersions(value?: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function normalizeAllowedVersionsInput(value?: string | null) {
  return JSON.stringify(parseAllowedVersions(value));
}

export function versionIsAllowed(version?: string | null, allowedVersionsJson?: string | null) {
  const allowedVersions = parseAllowedVersions(allowedVersionsJson);

  if (!allowedVersions.length || !version) {
    return true;
  }

  return allowedVersions.includes("*") || allowedVersions.includes(version);
}

export function normalizeLicenseReason({
  exists,
  productMatches,
  usable,
  activationAllowed,
  versionAllowed,
  hwidMatches = true,
  ipMatches = true,
  suspicious = false,
  status,
  blacklisted = false,
}: {
  exists: boolean;
  productMatches: boolean;
  usable: boolean;
  activationAllowed: boolean;
  versionAllowed: boolean;
  hwidMatches?: boolean;
  ipMatches?: boolean;
  suspicious?: boolean;
  status?: string | null;
  blacklisted?: boolean;
}) {
  if (!exists) return "invalid_key";
  if (!productMatches) return "product_mismatch";
  if (blacklisted) return "suspicious_activity";
  if (status === "Expired") return "expired";
  if (status === "Revoked") return "revoked";
  if (status === "Suspended") return "suspended";
  if (!usable) return "expired";
  if (!hwidMatches) return "hwid_mismatch";
  if (!ipMatches) return "ip_mismatch";
  if (!activationAllowed) return "activation_limit_reached";
  if (!versionAllowed) return "version_blocked";
  if (suspicious) return "suspicious_activity";
  return "valid";
}
