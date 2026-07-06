"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Blocks, Bot, Boxes, Code2, Globe2, PanelTop, Rocket, ServerCog, ShieldCheck, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Project } from "@/lib/content";
import { cn } from "@/lib/utils";

type Filter = string | "All";

const iconMap: Record<string, LucideIcon> = {
  Blocks,
  Bot,
  Boxes,
  Code2,
  Globe2,
  PanelTop,
  Rocket,
  ServerCog,
  ShieldCheck,
  Workflow,
};

export function ProjectsShowcase({
  initialProjects,
  limit,
  showHeading = true,
}: {
  initialProjects?: Project[];
  limit?: number;
  showHeading?: boolean;
}) {
  const [active, setActive] = useState<Filter>("All");
  const sourceProjects = useMemo(() => initialProjects || [], [initialProjects]);
  const filterOptions = useMemo(() => ["All", ...Array.from(new Set(sourceProjects.map((project) => project.category).filter(Boolean)))], [sourceProjects]);
  const featured = sourceProjects.find((project) => project.featured) || sourceProjects[0];

  const visibleProjects = useMemo(() => {
    const filtered = active === "All" ? sourceProjects : sourceProjects.filter((project) => project.category === active);
    const ordered = featured ? [featured, ...filtered.filter((project) => project.slug !== featured.slug)] : filtered;
    return typeof limit === "number" ? ordered.slice(0, limit) : ordered;
  }, [active, featured, limit, sourceProjects]);

  return (
    <section id="projects" className="px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto w-full max-w-7xl">
        {showHeading ? (
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading
              eyebrow="Portfolio"
              title="Selected work, packaged like product stories."
              description="A controlled showcase for web systems, plugins, bots, panels, internal tools, and product infrastructure."
            />
            <ButtonLink href="/projects" variant="secondary" className="w-fit">
              Open Portfolio
            </ButtonLink>
          </div>
        ) : null}

        <div className={showHeading ? "mt-8" : ""}>
          <div className="surface flex flex-wrap gap-2 rounded-lg p-2">
            {filterOptions.map((option) => {
              const selected = option === active;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setActive(option)}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition",
                    selected
                      ? "border-white/20 bg-white text-black"
                      : "border-white/8 bg-white/[0.03] text-white/58 hover:border-[#ff6262]/35 hover:text-white",
                  )}
                >
                  {option === "All" ? <Boxes className="h-4 w-4" aria-hidden="true" /> : null}
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <motion.div layout className="mt-8 grid gap-5 lg:grid-cols-6">
          <AnimatePresence mode="popLayout">
            {visibleProjects.map((project, index) => {
              const isFeatured = project.slug === featured?.slug && active === "All";
              return (
                <ProjectCard
                  key={project.slug}
                  project={project}
                  featured={isFeatured}
                  className={isFeatured ? "lg:col-span-6" : index % 3 === 0 ? "lg:col-span-3" : "lg:col-span-3 xl:col-span-2"}
                />
              );
            })}
          </AnimatePresence>
        </motion.div>

        {!visibleProjects.length ? (
          <div className="mt-8">
            <EmptyState
              icon={Boxes}
              title="No public projects are published yet."
              description="Projects appear here after admin-managed records are marked visible and launch-ready."
              action={{ label: "Contact MxF Labs", href: "/contact" }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ProjectCard({ project, featured, className }: { project: Project; featured: boolean; className?: string }) {
  const presentation = project.presentation;
  const accent = project.accentColor || presentation?.accentColor || "#ff6262";
  const Icon = iconMap[presentation?.iconName || ""] || Boxes;
  const metrics = presentation?.metrics?.slice(0, featured ? 3 : 2) || [];
  const highlights = presentation?.highlights?.slice(0, featured ? 4 : 2) || [];

  return (
    <motion.article
      layout
      id={project.slug}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28 }}
      className={className}
    >
      <Link
        href={`/projects/${project.slug}`}
        className={cn(
          "group relative grid h-full overflow-hidden rounded-lg border border-white/10 bg-[#0d1013]/86 transition duration-300 hover:-translate-y-1 hover:border-white/18",
          featured ? "min-h-[30rem] lg:grid-cols-[1fr_0.85fr]" : "min-h-[26rem]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background: `radial-gradient(circle at 18% 12%, ${withAlpha(accent, 0.22)}, transparent 34%), radial-gradient(circle at 86% 78%, ${withAlpha(accent, 0.12)}, transparent 30%)`,
          }}
        />
        <div className={cn("relative z-10 flex h-full flex-col", featured ? "p-6 md:p-8" : "p-5")}>
          <div className="flex items-start justify-between gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-md border border-white/10 bg-white/[0.04]">
              <Icon className="h-6 w-6" style={{ color: accent }} aria-hidden="true" />
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-white/62">
              {presentation?.badgeText || project.status}
            </span>
          </div>

          <div className="mt-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: accent }}>
              {project.category}
            </p>
            <h3 className={cn("mt-3 font-semibold text-white", featured ? "max-w-3xl text-4xl md:text-6xl" : "text-2xl")}>{project.name}</h3>
            <p className={cn("mt-4 max-w-2xl leading-7 text-white/58", featured ? "text-base" : "line-clamp-3 text-sm")}>{project.description}</p>
          </div>

          {metrics.length ? (
            <div className={cn("mt-6 grid gap-3", featured ? "sm:grid-cols-3" : "grid-cols-2")}>
              {metrics.map((metric) => (
                <div key={`${metric.label}-${metric.value}`} className="rounded-md border border-white/8 bg-black/18 p-3">
                  <p className="text-lg font-semibold text-white">{metric.value}</p>
                  <p className="mt-1 text-xs text-white/42">{metric.label}</p>
                </div>
              ))}
            </div>
          ) : null}

          {highlights.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {highlights.map((item) => (
                <span key={item} className="rounded-md border border-white/8 bg-white/[0.035] px-2.5 py-1 text-xs text-white/54">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap gap-2">
              {project.stack.slice(0, featured ? 5 : 3).map((item) => (
                <span key={item} className="rounded-md border border-white/8 bg-white/[0.035] px-2.5 py-1 text-xs text-white/54">
                  {item}
                </span>
              ))}
            </div>
          )}

          <span className="mt-auto pt-8 text-sm font-semibold text-white transition group-hover:text-[#ffd8d8]">
            View case study
          </span>
        </div>

        {featured ? (
          <div className="relative z-10 hidden min-h-full p-6 lg:block">
            <ProjectVisual project={project} accent={accent} large />
          </div>
        ) : (
          <div className="relative z-10 px-5 pb-5">
            <ProjectVisual project={project} accent={accent} />
          </div>
        )}
      </Link>
    </motion.article>
  );
}

function ProjectVisual({ project, accent, large = false }: { project: Project; accent: string; large?: boolean }) {
  const presentation = project.presentation;
  const rows = presentation?.process?.slice(0, large ? 4 : 3) || [];

  if (presentation?.showMockup === false) {
    return (
      <div className="rounded-lg border border-white/8 bg-black/20 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/34">{presentation.visualTitle || "Project"}</p>
        <p className="mt-3 text-sm leading-6 text-white/52">{presentation.summary || project.description}</p>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-white/10 bg-black/24", large ? "h-full min-h-[24rem] p-5" : "h-40 p-4")}>
      <div
        className="absolute inset-x-4 top-4 h-1 rounded-full"
        style={{ background: `linear-gradient(90deg, ${accent}, ${withAlpha(accent, 0.28)})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:26px_26px]" />
      <div className="relative mt-7 grid gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/38">{presentation?.visualTitle || project.name}</p>
        {(rows.length ? rows : fallbackVisualRows(project)).map((row, index) => (
          <div key={`${row.title}-${index}`} className="rounded-md border border-white/8 bg-white/[0.035] p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
              <p className="truncate text-sm font-semibold text-white/78">{row.title}</p>
            </div>
            {large ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/42">{row.description}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function fallbackVisualRows(project: Project) {
  return [
    { title: project.status, description: project.description },
    { title: project.stack.slice(0, 3).join(" / ") || "Custom system", description: "Configured in admin." },
    { title: project.category, description: "Portfolio presentation." },
  ];
}

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return `rgba(255, 98, 98, ${alpha})`;
  const value = Number.parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
