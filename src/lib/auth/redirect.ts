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

export function canonicalSiteUrl(requestUrl: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      return new URL(requestUrl).origin;
    }
  }

  return new URL(requestUrl).origin;
}
