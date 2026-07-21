import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const publicSiteIsFull = process.env.NEXT_PUBLIC_SITE_MODE === "full" || process.env.PUBLIC_SITE_MODE === "full";
const prelaunchRedirects = [
  "/about",
  "/announcements",
  "/changelog",
  "/checkout/:path*",
  "/contact",
  "/documentation",
  "/privacy",
  "/products/:path*",
  "/projects/:path*",
  "/refund-policy",
  "/refunds",
  "/search",
  "/services",
  "/support",
  "/terms",
];

if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    if (publicSiteIsFull) {
      return [];
    }

    return prelaunchRedirects.map((source) => ({
      source,
      destination: "/",
      permanent: false,
    }));
  },
};

export default nextConfig;
