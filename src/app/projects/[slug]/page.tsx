import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { accentClassMap } from "@/lib/content";
import { getPublicProject } from "@/lib/db/public";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProject(slug);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: project.name,
    description: project.description,
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPublicProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <section className="px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <ButtonLink href="/projects" variant="ghost" className="mb-8 px-0" showArrow={false}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to projects
        </ButtonLink>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-sm font-semibold text-[#ff6262]">{project.category}</p>
            <h1 className="mt-4 max-w-4xl text-balance text-5xl font-semibold text-white md:text-7xl">
              {project.name}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/64 md:text-lg">
              {project.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <StatusBadge tone={project.accent}>{project.status}</StatusBadge>
              {project.stack.map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/62"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={`/contact?project=${project.slug}`}>Request Similar Build</ButtonLink>
              <ButtonLink href="/projects" variant="secondary">
                Browse More
              </ButtonLink>
            </div>
          </div>

          <div className="surface-strong rounded-lg p-5">
            <div className={`h-2 rounded-sm bg-gradient-to-r ${accentClassMap[project.accent]}`} />
            <div className="mt-5 grid gap-4">
              {[
                project.caseStudy || "Structured around a clear brief, controlled scope, and a launch-ready handoff.",
                "Designed to capture goals, technical challenges, stack decisions, and final outcomes.",
                "Keep private builds anonymized while still showing the quality of the system.",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-md border border-white/8 bg-white/[0.035] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#ff6262]" aria-hidden="true" />
                  <p className="text-sm leading-6 text-white/64">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-md border border-white/10 bg-black/24 p-4">
              <p className="font-mono text-sm text-white/48">Case study module</p>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {Array.from({ length: 20 }).map((_, index) => (
                  <span
                    key={index}
                    className="h-10 rounded-sm border border-white/8 bg-white/[0.04]"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
