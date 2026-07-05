import { CtaBand } from "@/components/sections/cta-band";
import { Hero } from "@/components/sections/hero";
import { DocsPreview, HomeProductShowcase, MxfFactionsHomeFeature, WhyMxfLabs } from "@/components/sections/home-product-showcase";
import { AnnouncementBanner } from "@/components/public/announcement-banner";
import {
  getPublicAnnouncements,
  getPublicProducts,
} from "@/lib/db/public";
import { getSettings } from "@/lib/db/settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, announcements, homeSettings] = await Promise.all([
    getPublicProducts(),
    getPublicAnnouncements(),
    getSettings([
      "home.hero_badge",
      "home.hero_headline",
      "home.hero_subheadline",
      "home.hero_intro",
      "home.primary_cta_text",
      "home.primary_cta_link",
      "home.secondary_cta_text",
      "home.secondary_cta_link",
      "home.show_announcements",
    ]),
  ]);
  const mxfFactions = products.find((product) => product.slug === "mxf-factions");

  return (
    <>
      {homeSettings["home.show_announcements"] === "true" ? <AnnouncementBanner announcement={announcements[0]} /> : null}
      <Hero settings={homeSettings} products={products} />
      <HomeProductShowcase products={products} />
      {mxfFactions ? <MxfFactionsHomeFeature product={mxfFactions} /> : null}
      <WhyMxfLabs />
      <DocsPreview />
      <CtaBand />
    </>
  );
}
