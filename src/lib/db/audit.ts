import { requestIp } from "@/lib/request/ip";

const sensitivePattern = /secret|token|password|key|credential|webhook|auth|2fa|totp|recovery/i;

function normalizeValue(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return String(value);
  if (typeof value === "string") return value.length > 500 ? `${value.slice(0, 500)}...` : value;
  if (typeof value === "number" || typeof value === "boolean" || value === null || value === undefined) return value ?? null;

  try {
    return JSON.stringify(value).slice(0, 800);
  } catch {
    return String(value);
  }
}

function redactValue(field: string, value: unknown) {
  if (sensitivePattern.test(field)) {
    if (!value) return null;
    const text = String(value);
    return text.length <= 8 ? "[redacted]" : `${text.slice(0, 4)}...[redacted]`;
  }

  return normalizeValue(value);
}

function valuesEqual(left: unknown, right: unknown) {
  return JSON.stringify(normalizeValue(left)) === JSON.stringify(normalizeValue(right));
}

export function auditChanges<T extends Record<string, unknown>>(
  before: T | null | undefined,
  after: T | null | undefined,
  fields?: string[],
) {
  if (!before || !after) return [];

  const fieldList = fields || Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  return fieldList
    .filter((field) => !valuesEqual(before[field], after[field]))
    .map((field) => ({
      field,
      before: redactValue(field, before[field]),
      after: redactValue(field, after[field]),
    }));
}

export function requestAuditContext(request: Request) {
  return {
    ipAddress: requestIp(request),
    userAgent: request.headers.get("user-agent") || null,
  };
}

export function parseAuditMetadata(value: string) {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return { raw: value };
  }
}

export function auditSeverity(action: string, metadata: Record<string, unknown>) {
  const explicit = typeof metadata.severity === "string" ? metadata.severity.toLowerCase() : "";
  if (explicit === "critical" || explicit === "high" || explicit === "warning" || explicit === "info") return explicit;
  if (/deleted|revoked|disabled admin two-factor|failed admin|blacklist/i.test(action)) return "high";
  if (/created|updated|enabled|reset|generated|login/i.test(action)) return "warning";
  return "info";
}
