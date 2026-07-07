import { NextResponse } from "next/server";

export const CROSS_SITE_ADMIN_MESSAGE = "Cross-site admin requests are blocked.";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

type HeaderSource = {
  get(name: string): string | null;
};

function originFrom(value: string | null) {
  if (!value) return "";

  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function trustedOrigins(headers: HeaderSource, requestOrigin = "") {
  const origins = new Set<string>();
  const configuredSiteUrl = originFrom(process.env.NEXT_PUBLIC_SITE_URL || "");
  const host = headers.get("host")?.trim();

  if (requestOrigin) origins.add(requestOrigin);
  if (configuredSiteUrl) origins.add(configuredSiteUrl);

  if (host) {
    origins.add(`https://${host}`);
    origins.add(`http://${host}`);
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }

  return origins;
}

export function isTrustedAdminRequest(headers: HeaderSource, method = "GET", requestOrigin = "") {
  if (safeMethods.has(method)) return true;

  const origins = trustedOrigins(headers, requestOrigin);
  const origin = originFrom(headers.get("origin"));

  if (origin) return origins.has(origin);

  const refererOrigin = originFrom(headers.get("referer"));
  if (refererOrigin) return origins.has(refererOrigin);

  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  return true;
}

export function crossSiteAdminResponse(headers: HeaderSource, method = "GET", requestOrigin = "") {
  if (isTrustedAdminRequest(headers, method, requestOrigin)) return null;

  return NextResponse.json({ ok: false, message: CROSS_SITE_ADMIN_MESSAGE }, { status: 403 });
}
