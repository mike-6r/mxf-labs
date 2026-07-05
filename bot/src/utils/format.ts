export function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

export function shortId(value: string | null | undefined) {
  if (!value) return "unknown";
  return value.length <= 12 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function redact(value: unknown) {
  return JSON.stringify(value, (_key, innerValue) => {
    if (typeof innerValue !== "string") return innerValue;
    if (/token|secret|key|authorization|password/i.test(innerValue)) return "[redacted]";
    return innerValue.replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[redacted]");
  });
}
