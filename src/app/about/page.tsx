import type { Metadata } from "next";
import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { StatsStrip } from "@/components/sections/stats-strip";
import { StudioIntro } from "@/components/sections/studio-intro";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about MxF Labs, a personal development studio for custom software, web apps, game/server tools, bots, and digital products.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="A solo studio identity for serious custom software."
        description="MxF Labs is built around direct execution: web systems, backend logic, client tools, Discord bots, Minecraft plugins, and digital products that feel designed instead of assembled."
      />
      <StudioIntro />
      <StatsStrip />
      <CtaBand
        title="Need a developer who can own the whole build?"
        description="From frontend polish to backend integrations and support handoff, MxF Labs is designed for end-to-end delivery."
      />
    </>
  );
}
