import type { Metadata } from "next";
import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { ServicesGrid } from "@/components/sections/services-grid";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Full-stack web development, Discord bots, Minecraft plugins, dashboards, API integrations, product development, bug fixes, and custom client work.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Development services for web systems, bots, plugins, and products."
        description="Choose a focused build path or bring a custom request. MxF Labs handles the technical structure and the product polish together."
      />
      <ServicesGrid />
      <CtaBand
        title="Have a service request that does not fit neatly?"
        description="Custom work is the point. Send the shape of the problem, the constraints, and the outcome you want."
      />
    </>
  );
}
