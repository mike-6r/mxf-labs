import type { MetadataRoute } from "next";
import { navLinks, siteConfig } from "@/lib/content";
import { prelaunchModeEnabled } from "@/lib/launch-mode";

export default function sitemap(): MetadataRoute.Sitemap {
  if (prelaunchModeEnabled()) {
    return [
      {
        url: siteConfig.domain,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 1,
      },
      {
        url: new URL("/mxf-factions", siteConfig.domain).toString(),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      },
      {
        url: new URL("/docs/mxf-factions", siteConfig.domain).toString(),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      },
    ];
  }

  const routes = [{ href: "/" }, ...navLinks].map((route) => ({
    url: new URL(route.href, siteConfig.domain).toString(),
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route.href === "/" ? 1 : 0.8,
  }));

  return routes;
}
