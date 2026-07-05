import type { MetadataRoute } from "next";
import { navLinks, siteConfig } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [{ href: "/" }, ...navLinks].map((route) => ({
    url: new URL(route.href, siteConfig.domain).toString(),
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route.href === "/" ? 1 : 0.8,
  }));

  return routes;
}
