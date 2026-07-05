"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Boxes } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  accentClassMap,
  categoryIcons,
  projectCategories,
  type Accent,
  type Project,
  type ProjectCategory,
} from "@/lib/content";
import { cn } from "@/lib/utils";

type Filter = ProjectCategory | "All";

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
  const filterOptions: Filter[] = ["All", ...projectCategories];
  const sourceProjects = useMemo(() => initialProjects || [], [initialProjects]);

  const visibleProjects = useMemo(() => {
    const filtered =
      active === "All"
        ? sourceProjects
        : sourceProjects.filter((project) => project.category === active);
    return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
  }, [active, limit, sourceProjects]);

  return (
    <section id="projects" className="px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto w-full max-w-7xl">
        {showHeading ? (
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading
              eyebrow="Portfolio"
              title="Selected builds across web, bots, plugins, and products."
              description="A focused showcase for public launches, private systems, product concepts, and technical work that deserves a clean presentation."
            />
            <ButtonLink href="/projects" variant="secondary" className="w-fit">
              Open Portfolio
            </ButtonLink>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-2">
          {filterOptions.map((option) => {
            const Icon = option === "All" ? Boxes : categoryIcons[option];
            const selected = option === active;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setActive(option)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
                  selected
                    ? "bg-white text-black"
                    : "border border-white/8 bg-white/[0.035] text-white/62 hover:border-[#ff6262]/35 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {option}
              </button>
            );
          })}
        </div>

        <motion.div layout className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visibleProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
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

function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.article
      layout
      id={project.slug}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28 }}
      className="animated-border group relative rounded-lg"
    >
      <div className="surface scanline flex h-full flex-col rounded-lg p-5 transition duration-300 group-hover:-translate-y-1">
        <ProjectPreview accent={project.accent} name={project.name} />
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-[#ff6262]">{project.category}</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{project.name}</h3>
          </div>
          <StatusBadge tone={project.accent}>{project.status}</StatusBadge>
        </div>
        <p className="mt-4 text-sm leading-6 text-white/58">{project.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {project.stack.map((item) => (
            <span
              key={item}
              className="rounded-md border border-white/10 bg-white/[0.035] px-2.5 py-1 text-xs text-white/58"
            >
              {item}
            </span>
          ))}
        </div>
        <Link
          href={`/projects/${project.slug}`}
          className="mt-6 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white transition hover:border-[#ff6262]/40 hover:bg-white/[0.07]"
        >
          View Details
        </Link>
      </div>
    </motion.article>
  );
}

function ProjectPreview({ accent, name }: { accent: Accent; name: string }) {
  return (
    <div className="relative h-36 overflow-hidden rounded-md border border-white/10 bg-black/30">
      <div className={`absolute inset-x-4 top-4 h-1 rounded-sm bg-gradient-to-r ${accentClassMap[accent]}`} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-5 top-8 grid grid-cols-6 gap-2">
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={`${name}-${index}`}
            className={cn(
              "rounded-sm border border-white/8 bg-white/[0.045]",
              index % 5 === 0 && "col-span-2",
              index % 7 === 0 && "bg-[#ff6262]/12",
              index % 11 === 0 && "bg-[#f7b955]/10",
            )}
          />
        ))}
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
        <span className="h-2 w-14 rounded-sm bg-white/18" />
        <span className="h-2 flex-1 rounded-sm bg-white/8" />
        <span className="h-2 w-9 rounded-sm bg-[#ff6262]/28" />
      </div>
    </div>
  );
}
