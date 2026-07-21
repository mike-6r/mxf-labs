"use client";

import { Activity, Ban, Check, Eye, EyeOff, KeyRound, Plus, RefreshCw, Save, Search, ShieldAlert, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { PRODUCT_STATUS_OPTIONS } from "@/lib/products/status";
import { cn } from "@/lib/utils";

type ProductItem = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  featuresJson: string;
  techStackJson: string;
  faqJson: string;
  roadmapJson: string;
  screenshotsJson: string;
  licenseRulesJson: string;
  price: string;
  priceCents: number;
  currency: string;
  defaultActivationLimit: number;
  category: string;
  version: string;
  changelogJson: string;
  documentationLink: string | null;
  supportLink: string | null;
  purchaseButtonText: string;
  icon: string;
  visible: boolean;
  status: string;
};

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

type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  visibility: string;
  pinned: boolean;
  active: boolean;
};

type SupportTicketItem = {
  id: string;
  ticketNumber: string;
  name: string;
  email: string;
  discordUsername: string | null;
  priority: string;
  status: string;
  subject: string;
  message: string;
  internalNotes: string;
  relatedProduct?: { name: string } | null;
  notes: Array<{ id: string; author: string; body: string; createdAt: string | Date }>;
};

type ContactItem = {
  id: string;
  name: string;
  email: string;
  service: string;
  budget: string;
  description: string;
  status: string;
  notes: string;
  leadStage: string;
};

type LicenseItem = {
  id: string;
  key: string;
  status: string;
  blacklisted: boolean;
  licenseType: string;
  expirationDate: string | Date | null;
  minimumVersion: string | null;
  allowedVersionsJson: string;
  maxActivations: number;
  currentActivations: number;
  notes: string;
  lastValidatedAt?: string | Date | null;
  lastResetAt?: string | Date | null;
  resetCount?: number;
  transferCount?: number;
  createdAt?: string | Date;
  product?: { id: string; name: string } | null;
  customer?: { id: string; email: string; name: string } | null;
  activations?: Array<{
    id: string;
    deviceId: string;
    instanceId: string;
    discordId: string | null;
    ipAddress: string | null;
    country: string | null;
    productVersion: string | null;
    status: string;
    activationCount: number;
    firstSeenAt: string | Date;
    lastSeenAt: string | Date;
  }>;
  validations?: Array<{
    id: string;
    result: string;
    reason: string;
    deviceId: string | null;
    instanceId: string | null;
    ipAddress: string | null;
    productVersion: string | null;
    createdAt: string | Date;
  }>;
  suspiciousFlags?: Array<{
    id: string;
    severity: string;
    reason: string;
    status: string;
    createdAt: string | Date;
  }>;
};

type OrderItem = {
  id: string;
  status: string;
  amountCents: number;
  taxCents: number;
  currency: string;
  purchaseIntentId: string | null;
  notes: string;
  product?: { id: string; name: string } | null;
  customer?: { id: string; email: string; name: string } | null;
};

type SelectOption = { value: string; label: string };

const productStatuses = [...PRODUCT_STATUS_OPTIONS];
const projectCategories = ["Website", "Discord Bot", "Minecraft Plugin", "Web Panel", "API", "Product"];
const announcementTypes = ["Update", "Maintenance", "Release", "Alert", "General"];
const announcementVisibilities = ["Public", "Admin only", "Product customers only later"];
const ticketStatuses = ["Open", "Waiting", "In Progress", "Resolved", "Closed"];
const priorities = ["Low", "Normal", "High", "Urgent"];
const licenseStatuses = ["Active", "Suspended", "Expired", "Revoked"];
const orderStatuses = ["Pending", "Paid", "Fulfilled", "Refunded", "Failed", "Canceled"];
const currencies = ["USD", "EUR", "GBP", "CAD", "AUD"];

function jsonListToText(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.join("\n") : "";
  } catch {
    return "";
  }
}

function listFromForm(form: FormData, key: string) {
  const value = String(form.get(key) || "");
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function boolFromForm(form: FormData, key: string) {
  return form.get(key) === "on";
}

function Field({
  label,
  name,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
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

function TextArea({
  label,
  name,
  defaultValue,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue || ""}
        className="rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#ff6262]/60"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: string[];
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
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

function ActionButton({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="submit"
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition",
        tone === "danger"
          ? "border border-[#ff5f6d]/30 bg-[#ff5f6d]/10 text-[#ffd0dc] hover:bg-[#ff5f6d]/16"
          : "border border-[#ff6262]/24 bg-[#ff6262]/10 text-[#ffd8d8] hover:bg-[#ff6262]/16",
      )}
    >
      {children}
    </button>
  );
}

export function ProductManager({ products }: { products: ProductItem[] }) {
  const [items, setItems] = useState(products);
  const [message, setMessage] = useState("");

  function payload(form: FormData) {
    return {
      name: String(form.get("name")),
      slug: String(form.get("slug")),
      shortDescription: String(form.get("shortDescription")),
      fullDescription: String(form.get("fullDescription") || ""),
      features: listFromForm(form, "features"),
      techStack: listFromForm(form, "techStack"),
      faq: listFromForm(form, "faq"),
      roadmap: listFromForm(form, "roadmap"),
      screenshots: listFromForm(form, "screenshots"),
      licenseRules: listFromForm(form, "licenseRules"),
      price: String(form.get("price") || "Contact for pricing"),
      priceCents: String(form.get("priceCents") || "0"),
      currency: String(form.get("currency") || "USD"),
      defaultActivationLimit: String(form.get("defaultActivationLimit") || "3"),
      category: String(form.get("category") || "Product"),
      version: String(form.get("version") || "0.1.0"),
      changelog: listFromForm(form, "changelog"),
      documentationLink: String(form.get("documentationLink") || ""),
      supportLink: String(form.get("supportLink") || ""),
      purchaseButtonText: String(form.get("purchaseButtonText") || "Learn More"),
      icon: String(form.get("icon") || "PackageCheck"),
      status: String(form.get("status") || "Coming Soon"),
      visible: boolFromForm(form, "visible"),
    };
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(new FormData(event.currentTarget))),
    });
    const result = await response.json();
    if (result.product) setItems((current) => [result.product, ...current]);
    setMessage(response.ok ? "Product saved." : result.message || "Unable to save product.");
  }

  async function update(id: string, form: HTMLFormElement) {
    const response = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(new FormData(form))),
    });
    const result = await response.json();
    if (result.product) {
      setItems((current) => current.map((item) => (item.id === id ? result.product : item)));
    }
    setMessage(response.ok ? "Product updated." : result.message || "Unable to update product.");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this product?")) return;
    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={create} className="surface rounded-lg p-5">
        <ResourceHeader title="Create product" message={message} />
        <ProductFields />
        <div className="mt-5">
          <ActionButton>
            <Plus className="h-4 w-4" /> Create product
          </ActionButton>
        </div>
      </form>
      <div className="grid gap-4">
        {items.map((product) => (
          <details key={product.id} className="surface rounded-lg p-5">
            <summary className="cursor-pointer list-none">
              <ResourceSummary
                title={product.name}
                meta={`${product.status} / ${product.visible ? "Visible" : "Hidden"}`}
                description={product.shortDescription}
              />
            </summary>
            <form
              className="mt-5"
              onSubmit={(event) => {
                event.preventDefault();
                update(product.id, event.currentTarget);
              }}
            >
              <ProductFields product={product} />
              <div className="mt-5 flex flex-wrap gap-3">
                <ActionButton>
                  <Save className="h-4 w-4" /> Save
                </ActionButton>
                <button
                  type="button"
                  onClick={() => remove(product.id)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff5f6d]/30 bg-[#ff5f6d]/10 px-3 text-sm font-semibold text-[#ffd0dc]"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </form>
          </details>
        ))}
      </div>
    </div>
  );
}

function ProductFields({ product }: { product?: ProductItem }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Name" name="name" defaultValue={product?.name} required />
      <Field label="Slug" name="slug" defaultValue={product?.slug} required />
      <Field label="Short description" name="shortDescription" defaultValue={product?.shortDescription} required />
      <Field label="Category" name="category" defaultValue={product?.category || "Product"} />
      <Field label="Price" name="price" defaultValue={product?.price || "Contact for pricing"} />
      <Field label="Price cents" name="priceCents" defaultValue={String(product?.priceCents ?? 0)} />
      <SelectField label="Currency" name="currency" defaultValue={product?.currency || "USD"} options={currencies} />
      <Field label="Default activations" name="defaultActivationLimit" defaultValue={String(product?.defaultActivationLimit ?? 3)} />
      <Field label="Version" name="version" defaultValue={product?.version || "0.1.0"} />
      <Field label="Documentation link" name="documentationLink" defaultValue={product?.documentationLink} />
      <Field label="Support link" name="supportLink" defaultValue={product?.supportLink} />
      <Field label="Purchase button text" name="purchaseButtonText" defaultValue={product?.purchaseButtonText || "Learn More"} />
      <Field label="Icon name" name="icon" defaultValue={product?.icon || "PackageCheck"} />
      <SelectField label="Status" name="status" defaultValue={product?.status || "Coming Soon"} options={productStatuses} />
      <label className="flex items-center gap-3 rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm text-white/70">
        <input name="visible" type="checkbox" defaultChecked={product?.visible ?? true} />
        Visible on public site
      </label>
      <TextArea label="Full description" name="fullDescription" defaultValue={product?.fullDescription} />
      <TextArea label="Features" name="features" defaultValue={product ? jsonListToText(product.featuresJson) : ""} />
      <TextArea label="Tech stack" name="techStack" defaultValue={product ? jsonListToText(product.techStackJson) : ""} />
      <TextArea label="FAQ" name="faq" defaultValue={product ? jsonListToText(product.faqJson) : ""} />
      <TextArea label="Roadmap" name="roadmap" defaultValue={product ? jsonListToText(product.roadmapJson) : ""} />
      <TextArea label="Screenshots metadata" name="screenshots" defaultValue={product ? jsonListToText(product.screenshotsJson) : ""} />
      <TextArea label="License rules" name="licenseRules" defaultValue={product ? jsonListToText(product.licenseRulesJson) : ""} />
      <TextArea label="Changelog" name="changelog" defaultValue={product ? jsonListToText(product.changelogJson) : ""} />
    </div>
  );
}

export function ProjectManager({ projects }: { projects: ProjectItem[] }) {
  const [items, setItems] = useState(projects);
  const [message, setMessage] = useState("");

  function payload(form: FormData) {
    return {
      title: String(form.get("title")),
      slug: String(form.get("slug")),
      category: String(form.get("category") || "Website"),
      description: String(form.get("description")),
      techStack: listFromForm(form, "techStack"),
      status: String(form.get("status") || "Concept"),
      previewLink: String(form.get("previewLink") || ""),
      repositoryLabel: String(form.get("repositoryLabel") || ""),
      caseStudy: String(form.get("caseStudy") || ""),
      featured: boolFromForm(form, "featured"),
      visible: boolFromForm(form, "visible"),
    };
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(new FormData(event.currentTarget))),
    });
    const result = await response.json();
    if (result.project) setItems((current) => [result.project, ...current]);
    setMessage(response.ok ? "Project saved." : result.message || "Unable to save project.");
  }

  async function update(id: string, form: HTMLFormElement) {
    const response = await fetch(`/api/admin/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(new FormData(form))),
    });
    const result = await response.json();
    if (result.project) setItems((current) => current.map((item) => (item.id === id ? result.project : item)));
    setMessage(response.ok ? "Project updated." : result.message || "Unable to update project.");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this project?")) return;
    const response = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={create} className="surface rounded-lg p-5">
        <ResourceHeader title="Create project" message={message} />
        <ProjectFields />
        <div className="mt-5">
          <ActionButton>
            <Plus className="h-4 w-4" /> Create project
          </ActionButton>
        </div>
      </form>
      {items.map((project) => (
        <details key={project.id} className="surface rounded-lg p-5">
          <summary className="cursor-pointer list-none">
            <ResourceSummary
              title={project.title}
              meta={`${project.category} / ${project.featured ? "Featured" : "Standard"}`}
              description={project.description}
            />
          </summary>
          <form
            className="mt-5"
            onSubmit={(event) => {
              event.preventDefault();
              update(project.id, event.currentTarget);
            }}
          >
            <ProjectFields project={project} />
            <div className="mt-5 flex flex-wrap gap-3">
              <ActionButton>
                <Save className="h-4 w-4" /> Save
              </ActionButton>
              <button type="button" onClick={() => remove(project.id)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff5f6d]/30 bg-[#ff5f6d]/10 px-3 text-sm font-semibold text-[#ffd0dc]">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </form>
        </details>
      ))}
    </div>
  );
}

function ProjectFields({ project }: { project?: ProjectItem }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Title" name="title" defaultValue={project?.title} required />
      <Field label="Slug" name="slug" defaultValue={project?.slug} required />
      <SelectField label="Category" name="category" defaultValue={project?.category || "Website"} options={projectCategories} />
      <Field label="Status" name="status" defaultValue={project?.status || "Concept"} />
      <Field label="Description" name="description" defaultValue={project?.description} required />
      <Field label="Preview link" name="previewLink" defaultValue={project?.previewLink} />
      <Field label="Repository label" name="repositoryLabel" defaultValue={project?.repositoryLabel} />
      <TextArea label="Tech stack" name="techStack" defaultValue={project ? jsonListToText(project.techStackJson) : ""} />
      <TextArea label="Case study content" name="caseStudy" defaultValue={project?.caseStudy} rows={6} />
      <div className="grid gap-3">
        <label className="flex items-center gap-3 rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm text-white/70">
          <input name="featured" type="checkbox" defaultChecked={project?.featured ?? false} />
          Featured project
        </label>
        <label className="flex items-center gap-3 rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm text-white/70">
          <input name="visible" type="checkbox" defaultChecked={project?.visible ?? true} />
          Visible on public site
        </label>
      </div>
    </div>
  );
}

export function AnnouncementManager({ announcements }: { announcements: AnnouncementItem[] }) {
  const [items, setItems] = useState(announcements);
  const [message, setMessage] = useState("");

  function payload(form: FormData) {
    return {
      title: String(form.get("title")),
      body: String(form.get("body")),
      type: String(form.get("type") || "General"),
      visibility: String(form.get("visibility") || "Public"),
      pinned: boolFromForm(form, "pinned"),
      active: boolFromForm(form, "active"),
    };
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(new FormData(event.currentTarget))),
    });
    const result = await response.json();
    if (result.announcement) setItems((current) => [result.announcement, ...current]);
    setMessage(response.ok ? "Announcement saved." : result.message || "Unable to save announcement.");
  }

  async function update(id: string, form: HTMLFormElement) {
    const response = await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(new FormData(form))),
    });
    const result = await response.json();
    if (result.announcement) setItems((current) => current.map((item) => (item.id === id ? result.announcement : item)));
    setMessage(response.ok ? "Announcement updated." : result.message || "Unable to update announcement.");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this announcement?")) return;
    const response = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={create} className="surface rounded-lg p-5">
        <ResourceHeader title="Create announcement" message={message} />
        <AnnouncementFields />
        <div className="mt-5">
          <ActionButton>
            <Plus className="h-4 w-4" /> Create announcement
          </ActionButton>
        </div>
      </form>
      {items.map((announcement) => (
        <details key={announcement.id} className="surface rounded-lg p-5">
          <summary className="cursor-pointer list-none">
            <ResourceSummary
              title={announcement.title}
              meta={`${announcement.type} / ${announcement.visibility} / ${announcement.pinned ? "Pinned" : "Unpinned"}`}
              description={announcement.body}
            />
          </summary>
          <form
            className="mt-5"
            onSubmit={(event) => {
              event.preventDefault();
              update(announcement.id, event.currentTarget);
            }}
          >
            <AnnouncementFields announcement={announcement} />
            <div className="mt-5 flex flex-wrap gap-3">
              <ActionButton>
                <Save className="h-4 w-4" /> Save
              </ActionButton>
              <button type="button" onClick={() => remove(announcement.id)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff5f6d]/30 bg-[#ff5f6d]/10 px-3 text-sm font-semibold text-[#ffd0dc]">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </form>
        </details>
      ))}
    </div>
  );
}

function AnnouncementFields({ announcement }: { announcement?: AnnouncementItem }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Title" name="title" defaultValue={announcement?.title} required />
      <SelectField label="Type" name="type" defaultValue={announcement?.type || "General"} options={announcementTypes} />
      <SelectField label="Visibility" name="visibility" defaultValue={announcement?.visibility || "Public"} options={announcementVisibilities} />
      <TextArea label="Body" name="body" defaultValue={announcement?.body} />
      <label className="flex items-center gap-3 rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm text-white/70">
        <input name="pinned" type="checkbox" defaultChecked={announcement?.pinned ?? false} />
        Pinned
      </label>
      <label className="flex items-center gap-3 rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm text-white/70">
        <input name="active" type="checkbox" defaultChecked={announcement?.active ?? true} />
        Active
      </label>
    </div>
  );
}

export function SupportManager({ tickets }: { tickets: SupportTicketItem[] }) {
  const [items, setItems] = useState(tickets);
  const [filter, setFilter] = useState("All");
  const visibleTickets = filter === "All" ? items : items.filter((ticket) => ticket.status === filter);

  async function update(id: string, form: HTMLFormElement) {
    const response = await fetch(`/api/admin/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.status.value,
        priority: form.priority.value,
        internalNotes: form.internalNotes.value,
        note: form.note.value,
      }),
    });
    const result = await response.json();
    if (result.ticket) setItems((current) => current.map((item) => (item.id === id ? result.ticket : item)));
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this support ticket?")) return;
    const response = await fetch(`/api/admin/support/${id}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-4">
      <div className="surface flex flex-wrap items-center gap-3 rounded-lg p-4">
        <span className="text-sm font-semibold text-white">Filter</span>
        {["All", ...ticketStatuses].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={cn(
              "rounded-md border px-3 py-2 text-xs font-semibold transition",
              filter === status
                ? "border-white bg-white text-black"
                : "border-white/10 bg-white/[0.035] text-white/58 hover:text-white",
            )}
          >
            {status}
          </button>
        ))}
      </div>
      {visibleTickets.map((ticket) => (
        <form
          key={ticket.id}
          onSubmit={(event) => {
            event.preventDefault();
            update(ticket.id, event.currentTarget);
          }}
          className="surface rounded-lg p-5"
        >
          <ResourceSummary
            title={`${ticket.ticketNumber} / ${ticket.subject}`}
            meta={`${ticket.status} / ${ticket.priority} / ${ticket.relatedProduct?.name || "No product"}`}
            description={`${ticket.name} / ${ticket.email} / ${ticket.discordUsername || "No Discord"}`}
          />
          <p className="mt-4 text-sm leading-6 text-white/58">{ticket.message}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <SelectField label="Status" name="status" defaultValue={ticket.status} options={ticketStatuses} />
            <SelectField label="Priority" name="priority" defaultValue={ticket.priority} options={priorities} />
            <TextArea label="Internal notes" name="internalNotes" defaultValue={ticket.internalNotes} />
            <TextArea label="Add timeline note" name="note" />
          </div>
          <div className="mt-5">
            <ActionButton>
              <Save className="h-4 w-4" /> Update ticket
            </ActionButton>
            <button
              type="button"
              onClick={() => remove(ticket.id)}
              className="ml-3 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff5f6d]/30 bg-[#ff5f6d]/10 px-3 text-sm font-semibold text-[#ffd0dc]"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
          <div className="mt-5 grid gap-2 border-t border-white/8 pt-4">
            {ticket.notes.map((note) => (
              <p key={note.id} className="text-xs leading-5 text-white/44">
                {note.author}: {note.body}
              </p>
            ))}
            <p className="text-xs text-white/34">Ticket updates create customer notifications and email delivery records.</p>
          </div>
        </form>
      ))}
    </div>
  );
}

export function ContactManager({ submissions }: { submissions: ContactItem[] }) {
  const [items, setItems] = useState(submissions);

  async function update(id: string, form: HTMLFormElement) {
    const response = await fetch(`/api/admin/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.status.value,
        leadStage: form.leadStage.value,
        notes: form.notes.value,
      }),
    });
    const result = await response.json();
    if (result.submission) setItems((current) => current.map((item) => (item.id === id ? result.submission : item)));
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this contact submission?")) return;
    const response = await fetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <form
          key={item.id}
          onSubmit={(event) => {
            event.preventDefault();
            update(item.id, event.currentTarget);
          }}
          className="surface rounded-lg p-5"
        >
          <ResourceSummary
            title={`${item.name} / ${item.service}`}
            meta={`${item.status} / ${item.budget}`}
            description={item.description}
          />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <SelectField label="Status" name="status" defaultValue={item.status} options={["Unread", "Read", "Archived"]} />
            <Field label="Lead stage" name="leadStage" defaultValue={item.leadStage} />
            <TextArea label="Notes" name="notes" defaultValue={item.notes} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <ActionButton>
              <Save className="h-4 w-4" /> Save contact
            </ActionButton>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff5f6d]/30 bg-[#ff5f6d]/10 px-3 text-sm font-semibold text-[#ffd0dc]"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
            <span className="inline-flex min-h-10 items-center rounded-md border border-white/10 px-3 text-xs text-white/42">
              Saved contact records feed lead tracking and admin follow-up.
            </span>
          </div>
        </form>
      ))}
    </div>
  );
}

export function LicenseManager({
  licenses,
  products,
  customers,
}: {
  licenses: LicenseItem[];
  products: SelectOption[];
  customers: SelectOption[];
}) {
  const [items, setItems] = useState(licenses);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState("");

  const stats = useMemo(() => {
    const active = items.filter((item) => item.status === "Active").length;
    const flagged = items.filter((item) => (item.suspiciousFlags || []).length > 0 || item.blacklisted).length;
    const saturated = items.filter((item) => item.currentActivations >= item.maxActivations).length;

    return { active, flagged, saturated, total: items.length };
  }, [items]);

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return items.filter((license) => {
      const statusMatches = statusFilter === "All" || license.status === statusFilter;
      if (!normalized) return statusMatches;

      const searchable = [
        license.key,
        license.status,
        license.licenseType,
        license.product?.name,
        license.customer?.email,
        license.customer?.name,
        license.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return statusMatches && searchable.includes(normalized);
    });
  }, [items, query, statusFilter]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: form.get("productId"),
        customerId: form.get("customerId"),
        licenseType: form.get("licenseType"),
        maxActivations: form.get("maxActivations"),
        expirationDate: form.get("expirationDate"),
        minimumVersion: form.get("minimumVersion"),
        allowedVersionsJson: form.get("allowedVersionsJson"),
        notes: form.get("notes"),
      }),
    });
    const result = await response.json();
    if (result.license) setItems((current) => [result.license, ...current]);
    setMessage(response.ok ? "License generated." : result.message || "Unable to generate license.");
  }

  async function update(id: string, form: HTMLFormElement) {
    const response = await fetch(`/api/admin/licenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.status.value,
        blacklisted: form.blacklisted.checked,
        licenseType: form.licenseType.value,
        expirationDate: form.expirationDate.value,
        minimumVersion: form.minimumVersion.value,
        allowedVersionsJson: form.allowedVersionsJson.value,
        maxActivations: form.maxActivations.value,
        currentActivations: form.currentActivations.value,
        notes: form.notes.value,
      }),
    });
    const result = await response.json();
    if (result.license) setItems((current) => current.map((item) => (item.id === id ? result.license : item)));
    setMessage(response.ok ? "License saved." : result.message || "Unable to save license.");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this license?")) return;
    const response = await fetch(`/api/admin/licenses/${id}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  async function runAction(id: string, action: string, label: string) {
    const note =
      action === "append-note"
        ? window.prompt("Add an internal note for this license.")
        : window.prompt(`${label} reason`, "Admin review");

    if (note === null) return;

    const response = await fetch(`/api/admin/licenses/${id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        reason: note || label,
        note,
      }),
    });
    const result = await response.json();
    if (result.license) setItems((current) => current.map((item) => (item.id === id ? result.license : item)));
    setMessage(response.ok ? `${label} complete.` : result.message || `${label} failed.`);
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={create} className="surface rounded-lg p-5">
        <ResourceHeader title="Create manual license" message={message} />
        <div className="grid gap-4 md:grid-cols-2">
          <OptionSelect label="Product" name="productId" options={products} />
          <OptionSelect label="Customer" name="customerId" options={customers} />
          <SelectField label="License type" name="licenseType" defaultValue="Lifetime" options={["Permanent", "Monthly", "Yearly", "Lifetime", "Trial", "Custom"]} />
          <Field label="Max activations" name="maxActivations" defaultValue="1" />
          <Field label="Expiration date" name="expirationDate" />
          <Field label="Minimum version" name="minimumVersion" />
          <TextArea label="Allowed versions" name="allowedVersionsJson" />
          <TextArea label="Notes" name="notes" />
        </div>
        <div className="mt-5">
          <ActionButton>
            <Plus className="h-4 w-4" /> Generate license
          </ActionButton>
        </div>
      </form>

      <div className="surface rounded-lg p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <LicenseMetric icon={<KeyRound className="h-4 w-4" />} label="Total keys" value={stats.total} />
          <LicenseMetric icon={<Check className="h-4 w-4" />} label="Active" value={stats.active} />
          <LicenseMetric icon={<ShieldAlert className="h-4 w-4" />} label="Flagged" value={stats.flagged} />
          <LicenseMetric icon={<Activity className="h-4 w-4" />} label="At activation limit" value={stats.saturated} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search keys, customers, products, notes"
              className="h-11 w-full rounded-md border border-white/10 bg-black/24 pl-10 pr-3 text-sm text-white outline-none focus:border-[#ff6262]/60"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {["All", ...licenseStatuses].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "rounded-md border px-3 py-2 text-xs font-semibold transition",
                  statusFilter === status
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-white/[0.035] text-white/58 hover:text-white",
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="surface rounded-lg p-8 text-sm text-white/54">
          No licenses match this filter. Generate a key or clear the search to review all license records.
        </div>
      ) : null}

      {visibleItems.map((license) => (
        <form
          key={license.id}
          onSubmit={(event) => {
            event.preventDefault();
            update(license.id, event.currentTarget);
          }}
          className="surface rounded-lg p-5"
        >
          <LicenseSummary license={license} />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <SelectField label="Status" name="status" defaultValue={license.status} options={licenseStatuses} />
            <SelectField label="License type" name="licenseType" defaultValue={license.licenseType || "Lifetime"} options={["Permanent", "Monthly", "Yearly", "Lifetime", "Trial", "Custom"]} />
            <Field
              label="Expiration date"
              name="expirationDate"
              defaultValue={license.expirationDate ? new Date(license.expirationDate).toISOString().slice(0, 10) : ""}
            />
            <Field label="Minimum version" name="minimumVersion" defaultValue={license.minimumVersion || ""} />
            <Field label="Max activations" name="maxActivations" defaultValue={String(license.maxActivations)} />
            <Field label="Current activations" name="currentActivations" defaultValue={String(license.currentActivations)} />
            <label className="flex items-center gap-3 rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm text-white/70">
              <input name="blacklisted" type="checkbox" defaultChecked={license.blacklisted} />
              Blacklisted
            </label>
            <TextArea label="Allowed versions" name="allowedVersionsJson" defaultValue={jsonListToText(license.allowedVersionsJson)} />
            <TextArea label="Notes" name="notes" defaultValue={license.notes} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <LicenseTimeline title="Activations" empty="No active activations." items={(license.activations || []).map((activation) => ({
              id: activation.id,
              title: `${activation.status} activation`,
              meta: `${activation.productVersion || "No version"} / ${activation.activationCount} checks`,
              detail: `Last seen ${formatDate(activation.lastSeenAt)}`,
              secretLines: [
                `HWID: ${activation.deviceId}`,
                `Instance: ${activation.instanceId}`,
                `IP: ${activation.ipAddress || "No IP recorded"}`,
                `Discord: ${activation.discordId || "Not linked"}`,
                `Country: ${activation.country || "Not recorded"}`,
                `First seen: ${formatDate(activation.firstSeenAt)}`,
              ],
            }))} />
            <LicenseTimeline title="Validation history" empty="No validations yet." items={(license.validations || []).map((validation) => ({
              id: validation.id,
              title: `${validation.result} / ${validation.reason}`,
              meta: validation.deviceId || validation.instanceId || "No runtime ID",
              detail: `${validation.ipAddress || "No IP"} / ${formatDate(validation.createdAt)}`,
              secretLines: [
                `HWID: ${validation.deviceId || "Not recorded"}`,
                `Instance: ${validation.instanceId || "Not recorded"}`,
                `IP: ${validation.ipAddress || "No IP recorded"}`,
                `Version: ${validation.productVersion || "No version"}`,
              ],
            }))} />
            <LicenseTimeline title="Open flags" empty="No open flags." items={(license.suspiciousFlags || []).map((flag) => ({
              id: flag.id,
              title: `${flag.severity} / ${flag.reason}`,
              meta: flag.status,
              detail: formatDate(flag.createdAt),
            }))} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <ActionButton>
              <Save className="h-4 w-4" /> Save license
            </ActionButton>
            <button
              type="button"
              onClick={() => runAction(license.id, "reset-activations", "Reset HWID/device bindings")}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ffd166]/30 bg-[#ffd166]/10 px-3 text-sm font-semibold text-[#ffe6a3]"
            >
              <RefreshCw className="h-4 w-4" /> Reset HWID/device
            </button>
            <button
              type="button"
              onClick={() => runAction(license.id, "clear-ip-bindings", "Clear IP bindings")}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 text-sm font-semibold text-white/72"
            >
              <Activity className="h-4 w-4" /> Clear IPs
            </button>
            <button
              type="button"
              onClick={() => runAction(license.id, "sync-activation-count", "Sync activation count")}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 text-sm font-semibold text-white/72"
            >
              <Activity className="h-4 w-4" /> Sync count
            </button>
            {license.status === "Active" ? (
              <button
                type="button"
                onClick={() => runAction(license.id, "suspend", "Suspend license")}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff9f43]/30 bg-[#ff9f43]/10 px-3 text-sm font-semibold text-[#ffd8a8]"
              >
                <Ban className="h-4 w-4" /> Suspend
              </button>
            ) : (
              <button
                type="button"
                onClick={() => runAction(license.id, "activate", "Reactivate license")}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#40dca5]/30 bg-[#40dca5]/10 px-3 text-sm font-semibold text-[#b9ffe6]"
              >
                <Check className="h-4 w-4" /> Reactivate
              </button>
            )}
            <button
              type="button"
              onClick={() => runAction(license.id, "revoke", "Revoke license")}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff5f6d]/30 bg-[#ff5f6d]/10 px-3 text-sm font-semibold text-[#ffd0dc]"
            >
              <ShieldAlert className="h-4 w-4" /> Revoke
            </button>
            <button
              type="button"
              onClick={() => runAction(license.id, "append-note", "Add note")}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 text-sm font-semibold text-white/72"
            >
              Add note
            </button>
            <button
              type="button"
              onClick={() => remove(license.id)}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff5f6d]/30 bg-[#ff5f6d]/10 px-3 text-sm font-semibold text-[#ffd0dc]"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </form>
      ))}
    </div>
  );
}

function formatDate(value?: string | Date | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString();
}

function maskLicense(value: string) {
  const parts = value.split("-");
  if (parts.length >= 4) return `${parts[0]}-${parts[1]}-...-${parts.at(-1)}`;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function LicenseMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center gap-2 text-[#ff6262]">{icon}</div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/38">{label}</p>
    </div>
  );
}

function LicenseSummary({ license }: { license: LicenseItem }) {
  const isRisky = license.blacklisted || (license.suspiciousFlags || []).length > 0 || license.status !== "Active";
  const activationLabel = `${license.currentActivations}/${license.maxActivations} activations`;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-semibold",
              isRisky
                ? "border-[#ff9f43]/35 bg-[#ff9f43]/10 text-[#ffd8a8]"
                : "border-[#40dca5]/30 bg-[#40dca5]/10 text-[#b9ffe6]",
            )}
          >
            {license.status}
          </span>
          <span className="rounded-md border border-white/10 bg-white/[0.035] px-2.5 py-1 text-xs font-semibold text-white/58">
            {license.licenseType}
          </span>
          <span className="rounded-md border border-white/10 bg-white/[0.035] px-2.5 py-1 text-xs font-semibold text-white/58">
            {activationLabel}
          </span>
        </div>
        <h3 className="mt-3 break-all font-mono text-xl font-semibold text-white">{maskLicense(license.key)}</h3>
        <p className="mt-2 text-sm leading-6 text-white/54">
          {license.product?.name || "No product assigned"} / {license.customer?.email || "No customer assigned"}
        </p>
      </div>
      <div className="grid gap-2 rounded-md border border-white/10 bg-black/20 p-4 text-xs text-white/52">
        <span>Last validation: {formatDate(license.lastValidatedAt)}</span>
        <span>Last reset: {formatDate(license.lastResetAt)}</span>
        <span>Reset count: {license.resetCount ?? 0}</span>
        <span>Transfers: {license.transferCount ?? 0}</span>
      </div>
    </div>
  );
}

function LicenseTimeline({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{ id: string; title: string; meta: string; detail: string; secretLines?: string[] }>;
}) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  return (
    <div className="rounded-md border border-white/10 bg-black/18 p-4">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <div className="mt-3 grid gap-2">
        {items.length ? (
          items.map((item) => {
            const isRevealed = Boolean(revealed[item.id]);
            return (
              <div key={item.id} className="rounded-md border border-white/8 bg-white/[0.025] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white/78">{item.title}</p>
                    <p className="mt-1 truncate text-xs text-white/42">{item.meta}</p>
                    <p className="mt-1 truncate text-xs text-white/34">{item.detail}</p>
                  </div>
                  {item.secretLines?.length ? (
                    <button
                      type="button"
                      onClick={() => setRevealed((current) => ({ ...current, [item.id]: !isRevealed }))}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-white/52 transition hover:border-[#ff6262]/35 hover:text-white"
                      aria-label={isRevealed ? "Hide binding details" : "Reveal binding details"}
                    >
                      {isRevealed ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                    </button>
                  ) : null}
                </div>
                {isRevealed && item.secretLines?.length ? (
                  <div className="mt-3 grid gap-1 rounded-md border border-white/8 bg-black/24 p-2">
                    {item.secretLines.map((line) => (
                      <p key={line} className="break-all font-mono text-[11px] leading-5 text-white/52">
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="text-xs leading-5 text-white/38">{empty}</p>
        )}
      </div>
    </div>
  );
}

export function OrderManager({
  orders,
  products,
  customers,
}: {
  orders: OrderItem[];
  products: SelectOption[];
  customers: SelectOption[];
}) {
  const [items, setItems] = useState(orders);
  const [message, setMessage] = useState("");

  function payload(form: FormData) {
    return {
      productId: String(form.get("productId") || ""),
      customerId: String(form.get("customerId") || ""),
      status: String(form.get("status") || "Pending"),
      amountCents: String(form.get("amountCents") || "0"),
      taxCents: String(form.get("taxCents") || "0"),
      currency: String(form.get("currency") || "USD"),
      purchaseIntentId: String(form.get("purchaseIntentId") || ""),
      notes: String(form.get("notes") || ""),
    };
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(new FormData(event.currentTarget))),
    });
    const result = await response.json();
    if (result.order) setItems((current) => [result.order, ...current]);
    setMessage(response.ok ? "Order created." : result.message || "Unable to create order.");
  }

  async function update(id: string, form: HTMLFormElement) {
    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(new FormData(form))),
    });
    const result = await response.json();
    if (result.order) setItems((current) => current.map((item) => (item.id === id ? result.order : item)));
    setMessage(response.ok ? "Order updated." : result.message || "Unable to update order.");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this order?")) return;
    const response = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={create} className="surface rounded-lg p-5">
        <ResourceHeader title="Create manual order" message={message} />
        <OrderFields products={products} customers={customers} />
        <div className="mt-5 flex flex-wrap gap-3">
          <ActionButton>
            <Plus className="h-4 w-4" /> Create order
          </ActionButton>
          <span className="inline-flex min-h-10 items-center rounded-md border border-white/10 px-3 text-xs text-white/42">
            Stripe Checkout Sessions can replace manual creation later.
          </span>
        </div>
      </form>
      {items.map((order) => (
        <details key={order.id} className="surface rounded-lg p-5">
          <summary className="cursor-pointer list-none">
            <ResourceSummary
              title={`${order.product?.name || "No product"} / ${order.customer?.email || "No customer"}`}
              meta={`${order.status} / ${order.currency} ${((order.amountCents + order.taxCents) / 100).toFixed(2)}`}
              description={order.notes || order.purchaseIntentId || "Manual or Stripe-ready order record."}
            />
          </summary>
          <form
            className="mt-5"
            onSubmit={(event) => {
              event.preventDefault();
              update(order.id, event.currentTarget);
            }}
          >
            <OrderFields order={order} products={products} customers={customers} />
            <div className="mt-5 flex flex-wrap gap-3">
              <ActionButton>
                <Save className="h-4 w-4" /> Save order
              </ActionButton>
              <button
                type="button"
                onClick={() => remove(order.id)}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff5f6d]/30 bg-[#ff5f6d]/10 px-3 text-sm font-semibold text-[#ffd0dc]"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </form>
        </details>
      ))}
    </div>
  );
}

function OrderFields({
  order,
  products,
  customers,
}: {
  order?: OrderItem;
  products: SelectOption[];
  customers: SelectOption[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <OptionSelect label="Product" name="productId" defaultValue={order?.product?.id || ""} options={products} />
      <OptionSelect label="Customer" name="customerId" defaultValue={order?.customer?.id || ""} options={customers} />
      <SelectField label="Status" name="status" defaultValue={order?.status || "Pending"} options={orderStatuses} />
      <SelectField label="Currency" name="currency" defaultValue={order?.currency || "USD"} options={currencies} />
      <Field label="Amount cents" name="amountCents" defaultValue={String(order?.amountCents ?? 0)} />
      <Field label="Tax cents" name="taxCents" defaultValue={String(order?.taxCents ?? 0)} />
      <Field label="Purchase intent ID" name="purchaseIntentId" defaultValue={order?.purchaseIntentId} />
      <TextArea label="Notes" name="notes" defaultValue={order?.notes} />
    </div>
  );
}

function OptionSelect({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: SelectOption[];
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue || ""}
        className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60"
      >
        <option value="">None</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ResourceHeader({ title, message }: { title: string; message?: string }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="min-h-5 text-sm text-[#ff6262]" aria-live="polite">
        {message || ""}
      </p>
    </div>
  );
}

function ResourceSummary({
  title,
  meta,
  description,
}: {
  title: string;
  meta: string;
  description: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div>
        <p className="font-mono text-xs text-[#ff6262]">{meta}</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/54">{description}</p>
      </div>
      <span className="inline-flex w-fit items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/52">
        <Check className="h-3.5 w-3.5 text-[#ff6262]" aria-hidden="true" />
        Manage
      </span>
    </div>
  );
}
