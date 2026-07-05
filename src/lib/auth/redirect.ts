export function safeRelativeRedirectTarget(value: string | null | undefined, fallback = "/") {
  const target = value?.trim();

  if (!target) return fallback;
  if (target.startsWith("/") && !target.startsWith("//")) return target;

  try {
    const parsed = new URL(target);
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || fallback;
  } catch {
    return fallback;
  }
}
