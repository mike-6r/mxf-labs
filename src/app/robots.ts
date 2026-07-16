import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/content";
import { prelaunchModeEnabled } from "@/lib/launch-mode";

export default function robots(): MetadataRoute.Robots {
  if (prelaunchModeEnabled()) {
    return {
      rules: {
        userAgent: "*",
        allow: ["/", "/mxf-factions"],
        disallow: [
          "/products",
          "/projects",
          "/docs",
          "/support",
          "/contact",
          "/about",
          "/services",
          "/checkout",
        ],
      },
      sitemap: `${siteConfig.domain}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteConfig.domain}/sitemap.xml`,
  };
}
