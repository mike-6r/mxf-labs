import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Blocks, Bot, Boxes, CheckCircle2, Code2, ExternalLink, GalleryHorizontalEnd, Globe2, PanelTop, Rocket, ServerCog, ShieldCheck, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import type { Project } from "@/lib/content";
import { getPublicProject } from "@/lib/db/public";
import { cn } from "@/lib/utils";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

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
    description: project.presentation?.summary || project.description,
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPublicProject(slug);

  if (!project) {
    notFound();
  }

  const presentation = project.presentation;
  const accent = project.accentColor || presentation?.accentColor || "#ff6262";
  const Icon = iconMap[presentation?.iconName || ""] || Boxes;
  const hasStory = Boolean(presentation?.challenge || presentation?.solution || presentation?.outcome);
  const gallery = (presentation?.galleryImages || []).filter(Boolean);

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background: `radial-gradient(circle at 18% 20%, ${withAlpha(accent, 0.18)}, transparent 34%), radial-gradient(circle at 82% 54%, ${withAlpha(accent, 0.1)}, transparent 30%)`,
          }}
        />
        <div className="mx-auto max-w-7xl">
          <ButtonLink href="/projects" variant="ghost" className="mb-10 px-0" showArrow={false}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to projects
          </ButtonLink>

          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-md border border-white/10 bg-white/[0.04]">
                  <Icon className="h-6 w-6" style={{ color: accent }} aria-hidden="true" />
                </span>
                <p className="font-mono text-xs uppercase tracking-[0.22em]" style={{ color: accent }}>
                  {project.category}
                </p>
                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-white/62">
                  {presentation?.badgeText || project.status}
                </span>
              </div>

              <h1 className="mt-7 max-w-4xl text-balance text-5xl font-semibold text-white md:text-7xl">
                {project.name}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/64 md:text-lg">
                {presentation?.summary || project.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {project.stack.map((item) => (
                  <span key={item} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/62">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <SmartButton href={presentation?.primaryCtaHref || `/contact?project=${project.slug}`} primary>
                  {presentation?.primaryCtaLabel || "Request Similar Build"}
                </SmartButton>
                <SmartButton href={presentation?.secondaryCtaHref || project.previewLink || "/projects"}>
                  {presentation?.secondaryCtaLabel || "Browse More"}
                </SmartButton>
              </div>
            </div>

            <div className="relative z-10">
              <ProjectHeroVisual project={project} accent={accent} />
            </div>
          </div>
        </div>
      </section>

      {presentation?.showMetrics !== false && presentation?.metrics?.length ? (
        <section className="px-5 pb-10 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
            {presentation.metrics.map((metric) => (
              <div key={`${metric.label}-${metric.value}`} className="surface rounded-lg p-5">
                <p className="text-3xl font-semibold text-white">{metric.value}</p>
                <p className="mt-2 text-sm font-semibold text-white/70">{metric.label}</p>
                {metric.caption ? <p className="mt-2 text-sm leading-6 text-white/44">{metric.caption}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {hasStory ? (
        <section className="px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
            <StoryBlock title="Challenge" body={presentation?.challenge || ""} accent={accent} />
            <StoryBlock title="Solution" body={presentation?.solution || ""} accent={accent} />
            <StoryBlock title="Outcome" body={presentation?.outcome || ""} accent={accent} />
          </div>
        </section>
      ) : null}

      {presentation?.highlights?.length ? (
        <section className="px-5 py-10 md:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionIntro eyebrow="Highlights" title="What this build needed to communicate." />
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {presentation.highlights.map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-white/8 bg-white/[0.03] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} aria-hidden="true" />
                  <p className="text-sm leading-6 text-white/62">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {presentation?.process?.length ? (
        <section className="px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <SectionIntro eyebrow="Process" title="How the work is framed." />
            <div className="mt-7 grid gap-4">
              {presentation.process.map((item, index) => (
                <div key={`${item.title}-${index}`} className="grid gap-4 rounded-lg border border-white/8 bg-white/[0.03] p-5 md:grid-cols-[8rem_1fr] md:items-start">
                  <p className="font-mono text-xs uppercase tracking-[0.18em]" style={{ color: accent }}>
                    Step {String(index + 1).padStart(2, "0")}
                  </p>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-white/54">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {presentation?.showGallery !== false && gallery.length ? (
        <section className="px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <SectionIntro eyebrow="Gallery" title="Configured project visuals." />
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              {gallery.map((src, index) => (
                <figure key={`${src}-${index}`} className="surface overflow-hidden rounded-lg">
                  {/* Admin-provided project media only. Empty galleries are hidden. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={presentation.galleryCaptions?.[index] || `${project.name} visual ${index + 1}`} className="aspect-video w-full object-cover" />
                  {presentation.galleryCaptions?.[index] ? (
                    <figcaption className="border-t border-white/8 p-4 text-sm text-white/50">{presentation.galleryCaptions[index]}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-5 py-16 md:px-8">
        <div className="surface-strong mx-auto flex max-w-7xl flex-col justify-between gap-5 rounded-lg p-6 md:flex-row md:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em]" style={{ color: accent }}>Next build</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Want a project presented with this level of care?</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">MxF Labs can scope the system, build it, document it, and package the launch surface.</p>
          </div>
          <SmartButton href={`/contact?project=${project.slug}`} primary>
            Start a project
          </SmartButton>
        </div>
      </section>
    </>
  );
}

function ProjectHeroVisual({ project, accent }: { project: Project; accent: string }) {
  const presentation = project.presentation;
  const rows = presentation?.process?.slice(0, 4) || fallbackVisualRows(project);

  if (presentation?.showMockup === false) {
    return (
      <div className="surface-strong rounded-lg p-6">
        <GalleryHorizontalEnd className="h-6 w-6" style={{ color: accent }} aria-hidden="true" />
        <p className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-white/36">{presentation.visualTitle || "Project Brief"}</p>
        <p className="mt-3 text-lg leading-8 text-white/68">{presentation.summary || project.description}</p>
      </div>
    );
  }

  return (
    <div className="surface-strong relative min-h-[25rem] overflow-hidden rounded-lg p-5">
      <div
        className="absolute inset-x-5 top-5 h-1 rounded-full"
        style={{ background: `linear-gradient(90deg, ${accent}, ${withAlpha(accent, 0.28)})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="relative mt-9 rounded-lg border border-white/8 bg-black/24 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/38">{presentation?.visualTitle || project.name}</p>
        <div className="mt-5 grid gap-3">
          {rows.map((row, index) => (
            <div key={`${row.title}-${index}`} className="rounded-md border border-white/8 bg-white/[0.035] p-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
                <p className="text-sm font-semibold text-white">{row.title}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/48">{row.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StoryBlock({ title, body, accent }: { title: string; body: string; accent: string }) {
  if (!body) return null;

  return (
    <article className="surface rounded-lg p-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: accent }}>{title}</p>
      <p className="mt-4 text-sm leading-7 text-white/58">{body}</p>
    </article>
  );
}

function SectionIntro({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff8a8a]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">{title}</h2>
    </div>
  );
}

function SmartButton({ href, primary = false, children }: { href: string; primary?: boolean; children: React.ReactNode }) {
  const external = href.startsWith("http");
  const className = cn(
    "inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition",
    primary
      ? "button-shine bg-white text-black"
      : "border border-white/10 bg-white/[0.04] text-white/68 hover:border-[#ff6262]/35 hover:text-white",
  );
  const content = (
    <>
      <span className="relative z-10">{children}</span>
      <ExternalLink className="relative z-10 h-4 w-4" aria-hidden="true" />
    </>
  );

  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link href={href || "/projects"} className={className}>
      {content}
    </Link>
  );
}

function fallbackVisualRows(project: Project) {
  return [
    { title: project.status, description: project.description },
    { title: project.stack.slice(0, 3).join(" / ") || "Custom system", description: "Configured through the admin project editor." },
    { title: project.category, description: "Portfolio presentation and case-study framing." },
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
