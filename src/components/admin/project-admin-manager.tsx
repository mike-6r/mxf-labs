"use client";

import type { LucideIcon } from "lucide-react";
import { Boxes, Eye, EyeOff, GalleryHorizontalEnd, LayoutTemplate, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ProjectItem = {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  techStackJson: string;
  status: string;
  previewLink: string | null;
  repositoryLabel: string | null;
  caseStudy: string;
  featured: boolean;
  visible: boolean;
};

type ProjectPresentation = {
  layoutStyle: string;
  cardStyle: string;
  heroStyle: string;
  accentColor: string;
  iconName: string;
  badgeText: string;
  visualTitle: string;
  summary: string;
  challenge: string;
  solution: string;
  outcome: string;
  highlights: string[];
  metrics: Array<{ label: string; value: string; caption?: string }>;
  process: Array<{ title: string; description: string }>;
  galleryImages: string[];
  galleryCaptions: string[];
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  showMockup: boolean;
  showMetrics: boolean;
  showGallery: boolean;
};

const categories = ["Websites", "Discord Bots", "Minecraft Plugins", "Web Panels", "Products", "API", "Internal Systems", "Client Work"];
const statuses = ["Concept", "Planned", "In Progress", "In Development", "Active Development", "Release Candidate", "Published", "Private Build", "Archived"];
const layoutStyles = ["flagship", "compact", "case-study", "private", "product"];
const cardStyles = ["spotlight", "minimal", "timeline", "technical"];
const heroStyles = ["split", "editorial", "technical", "minimal"];
const iconNames = ["Boxes", "Code2", "Bot", "PanelTop", "Blocks", "Workflow", "ShieldCheck", "ServerCog", "Rocket", "Globe2"];

export function ProjectAdminManager({ projects }: { projects: ProjectItem[] }) {
  const [items, setItems] = useState(projects);
  const [message, setMessage] = useState("");
  const visibleCount = useMemo(() => items.filter((item) => item.visible).length, [items]);
  const featuredCount = useMemo(() => items.filter((item) => item.featured).length, [items]);

  function payload(form: FormData) {
    const presentation = presentationFromForm(form);

    return {
      title: String(form.get("title") || ""),
      slug: String(form.get("slug") || ""),
      category: String(form.get("category") || "Websites"),
      description: String(form.get("description") || ""),
      techStack: textToList(String(form.get("techStack") || "")),
      status: String(form.get("status") || "Concept"),
      previewLink: String(form.get("previewLink") || ""),
      repositoryLabel: String(form.get("repositoryLabel") || ""),
      caseStudy: JSON.stringify(presentation),
      featured: form.get("featured") === "on",
      visible: form.get("visible") === "on",
    };
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(new FormData(form))),
    });
    const result = await response.json().catch(() => ({}));

    if (result.project) {
      setItems((current) => [result.project, ...current]);
      form.reset();
    }

    setMessage(response.ok ? "Project created." : result.message || "Unable to create project.");
  }

  async function update(id: string, form: HTMLFormElement) {
    const response = await fetch(`/api/admin/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(new FormData(form))),
    });
    const result = await response.json().catch(() => ({}));

    if (result.project) {
      setItems((current) => current.map((item) => (item.id === id ? result.project : item)));
    }

    setMessage(response.ok ? "Project updated." : result.message || "Unable to update project.");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this project from the portfolio?")) return;
    const response = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      setItems((current) => current.filter((item) => item.id !== id));
      setMessage("Project deleted.");
    } else {
      setMessage(result.message || "Unable to delete project.");
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Visible projects" value={String(visibleCount)} />
        <Stat label="Featured projects" value={String(featuredCount)} />
        <Stat label="Admin-controlled fields" value="30+" />
      </div>

      <form onSubmit={create} className="surface rounded-lg p-5">
        <ManagerHeader title="Create project" description="Add a public portfolio item with configurable layout, visuals, metrics, links, and case-study content." message={message} />
        <ProjectFields />
        <div className="mt-5">
          <ActionButton>
            <Plus className="h-4 w-4" /> Create project
          </ActionButton>
        </div>
      </form>

      <div className="grid gap-4">
        {!items.length ? (
          <div className="surface rounded-lg p-8 text-center">
            <Boxes className="mx-auto h-8 w-8 text-[#ff6262]" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold text-white">No projects yet.</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-white/50">
              Create your first project above. Visible, non-concept projects will show on the public portfolio.
            </p>
          </div>
        ) : null}

        {items.map((project) => {
          const presentation = parsePresentation(project);
          return (
            <details key={project.id} className={cn("surface rounded-lg p-5", project.featured && "border-[#ff6262]/24")}>
              <summary className="cursor-pointer list-none">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff8a8a]">
                      {project.category} / {project.status} / {project.visible ? "Visible" : "Hidden"}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{project.title}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/52">{project.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{presentation.layoutStyle}</Badge>
                    {project.featured ? <Badge>Featured</Badge> : null}
                  </div>
                </div>
              </summary>

              <form
                className="mt-5 border-t border-white/8 pt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  update(project.id, event.currentTarget);
                }}
              >
                <ProjectFields project={project} />
                <div className="mt-5 flex flex-wrap gap-3">
                  <ActionButton>
                    <Save className="h-4 w-4" /> Save project
                  </ActionButton>
                  <button
                    type="button"
                    onClick={() => remove(project.id)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff5f6d]/30 bg-[#ff5f6d]/10 px-3 text-sm font-semibold text-[#ffd0dc] transition hover:bg-[#ff5f6d]/16"
                  >
                    <Trash2 className="h-4 w-4" /> Delete project
                  </button>
                  <a
                    href={`/projects/${project.slug}`}
                    className="inline-flex min-h-10 items-center rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/62 transition hover:border-[#ff6262]/35 hover:text-white"
                  >
                    View public page
                  </a>
                </div>
              </form>
            </details>
          );
        })}
      </div>
    </div>
  );
}

function ProjectFields({ project }: { project?: ProjectItem }) {
  const presentation = parsePresentation(project);

  return (
    <div className="grid gap-6">
      <FieldGroup icon={Boxes} title="Basics" description="Controls list placement, filtering, status, and public visibility.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Title" name="title" defaultValue={project?.title} required />
          <Field label="Slug" name="slug" defaultValue={project?.slug} required />
          <ComboField label="Category" name="category" defaultValue={project?.category || "Websites"} options={categories} />
          <ComboField label="Status" name="status" defaultValue={project?.status || "Concept"} options={statuses} />
          <Field label="Short description" name="description" defaultValue={project?.description} className="lg:col-span-2" required />
          <TextArea label="Tech stack" name="techStack" defaultValue={project ? jsonListToText(project.techStackJson) : ""} rows={4} />
          <div className="grid gap-3">
            <Toggle label="Visible on public site" name="visible" defaultChecked={project?.visible ?? true} />
            <Toggle label="Featured / larger treatment" name="featured" defaultChecked={project?.featured ?? false} />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup icon={LayoutTemplate} title="Presentation" description="Controls how this project looks on the portfolio and detail page.">
        <div className="grid gap-4 lg:grid-cols-3">
          <SelectField label="Layout style" name="layoutStyle" defaultValue={presentation.layoutStyle} options={layoutStyles} />
          <SelectField label="Card style" name="cardStyle" defaultValue={presentation.cardStyle} options={cardStyles} />
          <SelectField label="Hero style" name="heroStyle" defaultValue={presentation.heroStyle} options={heroStyles} />
          <Field label="Accent color" name="accentColor" defaultValue={presentation.accentColor} />
          <SelectField label="Icon" name="iconName" defaultValue={presentation.iconName} options={iconNames} />
          <Field label="Badge text" name="badgeText" defaultValue={presentation.badgeText} />
          <Field label="Visual title" name="visualTitle" defaultValue={presentation.visualTitle} className="lg:col-span-2" />
          <div className="grid gap-3">
            <Toggle label="Show visual mockup" name="showMockup" defaultChecked={presentation.showMockup} />
            <Toggle label="Show metrics" name="showMetrics" defaultChecked={presentation.showMetrics} />
            <Toggle label="Show gallery" name="showGallery" defaultChecked={presentation.showGallery} />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup icon={Sparkles} title="Case Study Content" description="This replaces the hardcoded fake project detail blocks.">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextArea label="Summary" name="summary" defaultValue={presentation.summary} rows={4} />
          <TextArea label="Highlights" name="highlights" defaultValue={presentation.highlights.join("\n")} rows={4} />
          <TextArea label="Challenge" name="challenge" defaultValue={presentation.challenge} rows={5} />
          <TextArea label="Solution" name="solution" defaultValue={presentation.solution} rows={5} />
          <TextArea label="Outcome" name="outcome" defaultValue={presentation.outcome} rows={5} />
          <TextArea label="Metrics" name="metrics" defaultValue={metricsToText(presentation.metrics)} rows={5} helper="One per line: Label|Value|Caption" />
          <TextArea label="Process" name="process" defaultValue={processToText(presentation.process)} rows={6} className="lg:col-span-2" helper="One per line: Step title|Description" />
        </div>
      </FieldGroup>

      <FieldGroup icon={GalleryHorizontalEnd} title="Links & Media" description="Screenshots stay optional. Empty media sections are hidden publicly.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Preview/live link" name="previewLink" defaultValue={project?.previewLink || ""} />
          <Field label="Repository/private label" name="repositoryLabel" defaultValue={project?.repositoryLabel || ""} />
          <Field label="Primary CTA label" name="primaryCtaLabel" defaultValue={presentation.primaryCtaLabel} />
          <Field label="Primary CTA link" name="primaryCtaHref" defaultValue={presentation.primaryCtaHref} />
          <Field label="Secondary CTA label" name="secondaryCtaLabel" defaultValue={presentation.secondaryCtaLabel} />
          <Field label="Secondary CTA link" name="secondaryCtaHref" defaultValue={presentation.secondaryCtaHref} />
          <TextArea label="Gallery image paths / URLs" name="galleryImages" defaultValue={presentation.galleryImages.join("\n")} rows={4} />
          <TextArea label="Gallery captions" name="galleryCaptions" defaultValue={presentation.galleryCaptions.join("\n")} rows={4} />
        </div>
      </FieldGroup>
    </div>
  );
}

function parsePresentation(project?: ProjectItem): ProjectPresentation {
  const fallback: ProjectPresentation = {
    layoutStyle: project?.featured ? "flagship" : "compact",
    cardStyle: project?.featured ? "spotlight" : "minimal",
    heroStyle: "split",
    accentColor: "#ff6262",
    iconName: "Boxes",
    badgeText: project?.featured ? "Featured build" : project?.status || "Project",
    visualTitle: project?.title || "Project system",
    summary: project?.caseStudy || project?.description || "",
    challenge: "",
    solution: "",
    outcome: "",
    highlights: [],
    metrics: [],
    process: [],
    galleryImages: [],
    galleryCaptions: [],
    primaryCtaLabel: "Request Similar Build",
    primaryCtaHref: project?.slug ? `/contact?project=${project.slug}` : "/contact",
    secondaryCtaLabel: "Browse More",
    secondaryCtaHref: "/projects",
    showMockup: true,
    showMetrics: true,
    showGallery: true,
  };

  if (!project?.caseStudy) return fallback;

  try {
    const parsed = JSON.parse(project.caseStudy);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fallback;
    return {
      ...fallback,
      ...parsed,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.map(String).filter(Boolean) : fallback.highlights,
      metrics: Array.isArray(parsed.metrics) ? parsed.metrics.map(normalizeMetric).filter(Boolean) : fallback.metrics,
      process: Array.isArray(parsed.process) ? parsed.process.map(normalizeProcess).filter(Boolean) : fallback.process,
      galleryImages: Array.isArray(parsed.galleryImages) ? parsed.galleryImages.map(String).filter(Boolean) : fallback.galleryImages,
      galleryCaptions: Array.isArray(parsed.galleryCaptions) ? parsed.galleryCaptions.map(String) : fallback.galleryCaptions,
      showMockup: parsed.showMockup !== false,
      showMetrics: parsed.showMetrics !== false,
      showGallery: parsed.showGallery !== false,
    };
  } catch {
    return fallback;
  }
}

function presentationFromForm(form: FormData): ProjectPresentation {
  return {
    layoutStyle: String(form.get("layoutStyle") || "compact"),
    cardStyle: String(form.get("cardStyle") || "minimal"),
    heroStyle: String(form.get("heroStyle") || "split"),
    accentColor: String(form.get("accentColor") || "#ff6262"),
    iconName: String(form.get("iconName") || "Boxes"),
    badgeText: String(form.get("badgeText") || ""),
    visualTitle: String(form.get("visualTitle") || ""),
    summary: String(form.get("summary") || ""),
    challenge: String(form.get("challenge") || ""),
    solution: String(form.get("solution") || ""),
    outcome: String(form.get("outcome") || ""),
    highlights: textToList(String(form.get("highlights") || "")),
    metrics: textToMetrics(String(form.get("metrics") || "")),
    process: textToProcess(String(form.get("process") || "")),
    galleryImages: textToList(String(form.get("galleryImages") || "")),
    galleryCaptions: textToList(String(form.get("galleryCaptions") || "")),
    primaryCtaLabel: String(form.get("primaryCtaLabel") || "Request Similar Build"),
    primaryCtaHref: String(form.get("primaryCtaHref") || "/contact"),
    secondaryCtaLabel: String(form.get("secondaryCtaLabel") || "Browse More"),
    secondaryCtaHref: String(form.get("secondaryCtaHref") || "/projects"),
    showMockup: form.get("showMockup") === "on",
    showMetrics: form.get("showMetrics") === "on",
    showGallery: form.get("showGallery") === "on",
  };
}

function normalizeMetric(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const label = String(record.label || "").trim();
  const metricValue = String(record.value || "").trim();
  const caption = String(record.caption || "").trim();
  return label && metricValue ? { label, value: metricValue, caption } : null;
}

function normalizeProcess(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const title = String(record.title || "").trim();
  const description = String(record.description || "").trim();
  return title && description ? { title, description } : null;
}

function textToList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function textToMetrics(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => {
      const [label, metricValue, caption] = line.split("|").map((item) => item?.trim() || "");
      return label && metricValue ? { label, value: metricValue, caption } : null;
    })
    .filter((item): item is { label: string; value: string; caption: string } => Boolean(item));
}

function textToProcess(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => {
      const [title, description] = line.split("|").map((item) => item?.trim() || "");
      return title && description ? { title, description } : null;
    })
    .filter((item): item is { title: string; description: string } => Boolean(item));
}

function jsonListToText(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.join("\n") : "";
  } catch {
    return "";
  }
}

function metricsToText(metrics: ProjectPresentation["metrics"]) {
  return metrics.map((metric) => [metric.label, metric.value, metric.caption].filter(Boolean).join("|")).join("\n");
}

function processToText(process: ProjectPresentation["process"]) {
  return process.map((item) => `${item.title}|${item.description}`).join("\n");
}

function ManagerHeader({ title, description, message }: { title: string; description: string; message: string }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff8a8a]">Portfolio control</p>
        <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">{description}</p>
      </div>
      <p className="min-h-5 text-sm font-semibold text-[#ff8a8a]" aria-live="polite">
        {message}
      </p>
    </div>
  );
}

function FieldGroup({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/8 bg-white/[0.025] p-4">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[#ff6262]/20 bg-[#ff6262]/10">
          <Icon className="h-4 w-4 text-[#ff8a8a]" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-white/44">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required = false,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue || ""}
        className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60"
      />
    </label>
  );
}

function ComboField({ label, name, defaultValue, options }: { label: string; name: string; defaultValue?: string; options: string[] }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue || ""}
        list={`${name}-options`}
        className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60"
      />
      <datalist id={`${name}-options`}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

function SelectField({ label, name, defaultValue, options }: { label: string; name: string; defaultValue?: string; options: string[] }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue || options[0]}
        className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows = 4,
  helper,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  helper?: string;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue || ""}
        className="rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#ff6262]/60"
      />
      {helper ? <span className="text-xs leading-5 text-white/34">{helper}</span> : null}
    </label>
  );
}

function Toggle({ label, name, defaultChecked }: { label: string; name: string; defaultChecked: boolean }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-white/10 bg-black/24 px-3 text-sm font-semibold text-white/70">
      <span className="flex items-center gap-2">
        {defaultChecked ? <Eye className="h-4 w-4 text-[#ff6262]" aria-hidden="true" /> : <EyeOff className="h-4 w-4 text-white/34" aria-hidden="true" />}
        {label}
      </span>
      <input name={name} type="checkbox" defaultChecked={defaultChecked} />
    </label>
  );
}

function ActionButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10 px-3 text-sm font-semibold text-[#ffd8d8] transition hover:bg-[#ff6262]/16"
    >
      {children}
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-white/52">
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface rounded-lg p-4">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/36">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
