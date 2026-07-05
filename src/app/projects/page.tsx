import type { Metadata } from "next";
import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { ProjectsShowcase } from "@/components/sections/projects-showcase";
import { getPublicProjects } from "@/lib/db/public";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Explore the MxF Labs portfolio for websites, Discord bots, Minecraft plugins, web panels, and products.",
};

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getPublicProjects();

  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        title="A project showcase for technical work with a strong point of view."
        description="Filter by category and explore the kinds of systems MxF Labs is built to deliver across websites, bots, plugins, panels, and products."
      />
      <ProjectsShowcase initialProjects={projects} showHeading={false} />
      <CtaBand
        title="Want your project to be the next card here?"
        description="Bring the idea, the workflow, or the broken system. MxF Labs can scope it into something clean and shippable."
      />
    </>
  );
}
