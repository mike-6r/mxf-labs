"use client";

import type { LucideIcon } from "lucide-react";
import { BookOpen, Download, Eye, EyeOff, FileArchive, FileText, Layers3, Link2, Plus, Save, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ProductOption = {
  id: string;
  name: string;
  slug: string;
  version: string;
};

type LinkedProduct = {
  id: string;
  name: string;
  slug: string;
} | null;

type LinkedRelease = {
  id: string;
  title: string;
  version: string;
  productId: string;
} | null;

type DocumentationArticleItem = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  bodyMarkdown: string;
  version: string;
  productId: string | null;
  productVersion: string | null;
  product: LinkedProduct;
  visible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type ProductReleaseItem = {
  id: string;
  productId: string;
  product: NonNullable<LinkedProduct>;
  version: string;
  title: string;
  notes: string;
  releaseType: string;
  status: string;
  isLatest: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProductDownloadItem = {
  id: string;
  productId: string;
  product: NonNullable<LinkedProduct>;
  releaseId: string | null;
  release: LinkedRelease;
  filename: string;
  fileType: string;
  storageKey: string;
  fileSize: number;
  checksum: string | null;
  version: string;
  visible: boolean;
  requiresLicense: boolean;
  createdAt: string;
  updatedAt: string;
};

type DownloadEventItem = {
  id: string;
  status: string;
  createdAt: string;
  customer: { email: string } | null;
  download: { filename: string; product: { name: string } } | null;
};

type DownloadTokenItem = {
  id: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  customer: { email: string } | null;
  download: { filename: string } | null;
};

type TabKey = "docs" | "releases" | "downloads" | "activity";

const docCategories = [
  "Getting Started",
  "Installation",
  "Requirements",
  "Configuration",
  "Feature Setup",
  "Commands",
  "Permissions",
  "Variables",
  "Gameplay",
  "Progression",
  "Competitive",
  "Staff Operations",
  "API",
  "Integrations",
  "Licensing",
  "Web Dashboard",
  "Developer API",
  "FAQ",
  "Troubleshooting",
  "Changelog",
  "Guide",
];

const releaseTypes = ["Release", "Beta", "Patch", "Preview", "Hotfix", "Internal"];
const releaseStatuses = ["Draft", "Published", "Archived", "Private"];
const fileTypes = ["JAR", "ZIP", "PDF", "JSON", "TXT", "Other"];

export function DeliveryManager({
  docs,
  releases,
  downloads,
  products,
  events = [],
  tokens = [],
  initialTab = "docs",
  enabledTabs = ["docs", "releases", "downloads", "activity"],
}: {
  docs: DocumentationArticleItem[];
  releases: ProductReleaseItem[];
  downloads: ProductDownloadItem[];
  products: ProductOption[];
  events?: DownloadEventItem[];
  tokens?: DownloadTokenItem[];
  initialTab?: TabKey;
  enabledTabs?: TabKey[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>(enabledTabs.includes(initialTab) ? initialTab : enabledTabs[0] || "docs");
  const [docItems, setDocItems] = useState(docs);
  const [releaseItems, setReleaseItems] = useState(releases);
  const [downloadItems, setDownloadItems] = useState(downloads);
  const [notice, setNotice] = useState("");

  const tabs = useMemo(
    () =>
      [
        { id: "docs" as const, label: "Docs", icon: BookOpen, count: docItems.length },
        { id: "releases" as const, label: "Releases", icon: Layers3, count: releaseItems.length },
        { id: "downloads" as const, label: "Downloads", icon: Download, count: downloadItems.length },
        { id: "activity" as const, label: "Activity", icon: FileText, count: events.length + tokens.length },
      ].filter((tab) => enabledTabs.includes(tab.id)),
    [docItems.length, downloadItems.length, enabledTabs, events.length, releaseItems.length, tokens.length],
  );

  function productName(productId?: string | null) {
    return products.find((product) => product.id === productId)?.name || "Platform";
  }

  function releaseLabel(releaseId?: string | null) {
    const release = releaseItems.find((item) => item.id === releaseId);
    return release ? `${release.product.name} / v${release.version}` : "No release";
  }

  async function createDoc(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = await jsonRequest("/api/admin/documentation", "POST", docPayload(new FormData(form)), setNotice);
    if (result?.article) {
      setDocItems((current) => [result.article, ...current]);
      form.reset();
      setNotice("Documentation article created.");
    }
  }

  async function updateDoc(id: string, form: HTMLFormElement) {
    const result = await jsonRequest(`/api/admin/documentation/${id}`, "PATCH", docPayload(new FormData(form)), setNotice);
    if (result?.article) {
      setDocItems((current) => current.map((item) => (item.id === id ? result.article : item)));
      setNotice("Documentation article updated.");
    }
  }

  async function removeDoc(id: string) {
    if (!window.confirm("Delete this documentation article?")) return;
    const response = await fetch(`/api/admin/documentation/${id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      setDocItems((current) => current.filter((item) => item.id !== id));
      setNotice("Documentation article deleted.");
    } else {
      setNotice(result.message || "Unable to delete documentation article.");
    }
  }

  async function createRelease(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = await jsonRequest("/api/admin/releases", "POST", releasePayload(new FormData(form)), setNotice);
    if (result?.release) {
      setReleaseItems((current) => markLatest([result.release, ...current], result.release));
      form.reset();
      setNotice("Release created.");
    }
  }

  async function updateRelease(id: string, form: HTMLFormElement) {
    const result = await jsonRequest(`/api/admin/releases/${id}`, "PATCH", releasePayload(new FormData(form)), setNotice);
    if (result?.release) {
      setReleaseItems((current) => markLatest(current.map((item) => (item.id === id ? result.release : item)), result.release));
      setNotice("Release updated.");
    }
  }

  async function removeRelease(id: string) {
    if (!window.confirm("Delete this release? Linked downloads will keep the product file but lose the release link.")) return;
    const response = await fetch(`/api/admin/releases/${id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      setReleaseItems((current) => current.filter((item) => item.id !== id));
      setDownloadItems((current) => current.map((item) => (item.releaseId === id ? { ...item, releaseId: null, release: null } : item)));
      setNotice("Release deleted.");
    } else {
      setNotice(result.message || "Unable to delete release.");
    }
  }

  async function createDownload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = await formRequest("/api/admin/downloads", "POST", new FormData(form), setNotice);
    if (result?.download) {
      setDownloadItems((current) => [result.download, ...current]);
      form.reset();
      setNotice("Download file created.");
    }
  }

  async function updateDownload(id: string, form: HTMLFormElement) {
    const result = await formRequest(`/api/admin/downloads/${id}`, "PATCH", new FormData(form), setNotice);
    if (result?.download) {
      setDownloadItems((current) => current.map((item) => (item.id === id ? result.download : item)));
      setNotice("Download file updated.");
    }
  }

  async function removeDownload(id: string) {
    if (!window.confirm("Delete this download record and remove the local private file if it exists?")) return;
    const response = await fetch(`/api/admin/downloads/${id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      setDownloadItems((current) => current.filter((item) => item.id !== id));
      setNotice("Download deleted.");
    } else {
      setNotice(result.message || "Unable to delete download.");
    }
  }

  return (
    <div className="grid gap-6">
      <div className="surface flex flex-col gap-4 rounded-lg p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff8a8a]">Delivery control</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Manage public docs, release records, and private files.</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-white/48">
            Product docs are public when visible. Product files stay private and are delivered through signed portal download tokens.
          </p>
        </div>
        <p className="min-h-5 text-sm font-semibold text-[#ff8a8a]" aria-live="polite">
          {notice}
        </p>
      </div>

      <div className="surface flex flex-wrap gap-2 rounded-lg p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition",
                activeTab === tab.id
                  ? "border-white/20 bg-white text-black"
                  : "border-white/8 bg-white/[0.03] text-white/56 hover:border-[#ff6262]/35 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
              <span className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-[11px] opacity-70">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "docs" ? (
        <section className="grid gap-6">
          <form onSubmit={createDoc} className="surface rounded-lg p-5">
            <SectionTitle icon={Plus} title="Create documentation" description="Write a public docs page and optionally link it to a product." />
            <DocFields products={products} />
            <div className="mt-5">
              <ActionButton>
                <Plus className="h-4 w-4" /> Create article
              </ActionButton>
            </div>
          </form>

          <div className="grid gap-4">
            {docItems.length ? null : <EmptyPanel title="No documentation yet." description="Create your first public setup guide, API reference, or product onboarding article." />}
            {docItems.map((doc) => (
              <details key={doc.id} className="surface rounded-lg p-5">
                <summary className="cursor-pointer list-none">
                  <ItemSummary
                    icon={BookOpen}
                    title={doc.title}
                    meta={`${doc.category} / ${productName(doc.productId)} / ${doc.visible ? "Visible" : "Hidden"}`}
                    description={doc.excerpt || "No excerpt yet."}
                    href={`/docs/${doc.slug}`}
                  />
                </summary>
                <form
                  className="mt-5 border-t border-white/8 pt-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    updateDoc(doc.id, event.currentTarget);
                  }}
                >
                  <DocFields doc={doc} products={products} />
                  <FormActions onDelete={() => removeDoc(doc.id)} deleteLabel="Delete article" saveLabel="Save article" />
                </form>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "releases" ? (
        <section className="grid gap-6">
          <form onSubmit={createRelease} className="surface rounded-lg p-5">
            <SectionTitle icon={Layers3} title="Create release" description="Attach version notes to a product and optionally mark it as the latest release." />
            <ReleaseFields products={products} />
            <div className="mt-5">
              <ActionButton>
                <Plus className="h-4 w-4" /> Create release
              </ActionButton>
            </div>
          </form>

          <div className="grid gap-4">
            {releaseItems.length ? null : <EmptyPanel title="No releases yet." description="Create release records so downloads, changelogs, and product detail pages have version context." />}
            {releaseItems.map((release) => (
              <details key={release.id} className="surface rounded-lg p-5">
                <summary className="cursor-pointer list-none">
                  <ItemSummary
                    icon={Layers3}
                    title={release.title}
                    meta={`${release.product.name} / v${release.version} / ${release.status}${release.isLatest ? " / Latest" : ""}`}
                    description={release.notes || "No release notes yet."}
                  />
                </summary>
                <form
                  className="mt-5 border-t border-white/8 pt-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    updateRelease(release.id, event.currentTarget);
                  }}
                >
                  <ReleaseFields release={release} products={products} />
                  <FormActions onDelete={() => removeRelease(release.id)} deleteLabel="Delete release" saveLabel="Save release" />
                </form>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "downloads" ? (
        <section className="grid gap-6">
          <form onSubmit={createDownload} className="surface rounded-lg p-5">
            <SectionTitle icon={Upload} title="Upload or link private file" description="Upload a product file or register an existing private storage key. Files are not publicly exposed." />
            <DownloadFields products={products} releases={releaseItems} />
            <div className="mt-5">
              <ActionButton>
                <Upload className="h-4 w-4" /> Save download
              </ActionButton>
            </div>
          </form>

          <div className="grid gap-4">
            {downloadItems.length ? null : <EmptyPanel title="No downloads yet." description="Upload the first private product ZIP, JAR, docs package, or release archive." />}
            {downloadItems.map((download) => (
              <details key={download.id} className="surface rounded-lg p-5">
                <summary className="cursor-pointer list-none">
                  <ItemSummary
                    icon={FileArchive}
                    title={download.filename}
                    meta={`${download.product.name} / v${download.version} / ${download.fileType} / ${download.visible ? "Visible" : "Hidden"}`}
                    description={`${formatFileSize(download.fileSize)} / ${releaseLabel(download.releaseId)} / ${download.storageKey}`}
                    href={`/api/downloads/${download.id}`}
                  />
                </summary>
                <form
                  className="mt-5 border-t border-white/8 pt-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    updateDownload(download.id, event.currentTarget);
                  }}
                >
                  <DownloadFields download={download} products={products} releases={releaseItems} />
                  <FormActions onDelete={() => removeDownload(download.id)} deleteLabel="Delete download" saveLabel="Save download" />
                </form>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "activity" ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <ActivityPanel title="Download events" empty="No download events yet.">
            {events.map((event) => (
              <ActivityItem
                key={event.id}
                title={event.status}
                meta={`${event.download?.product.name || "Product"} / ${event.download?.filename || "Unknown file"}`}
                detail={`${event.customer?.email || "Anonymous"} / ${formatDateTime(event.createdAt)}`}
              />
            ))}
          </ActivityPanel>
          <ActivityPanel title="Temporary tokens" empty="No temporary tokens yet.">
            {tokens.map((token) => (
              <ActivityItem
                key={token.id}
                title={token.usedAt ? "Used token" : "Active token"}
                meta={`${token.download?.filename || "Unknown file"} / ${token.customer?.email || "No customer"}`}
                detail={`Expires ${formatDateTime(token.expiresAt)}`}
              />
            ))}
          </ActivityPanel>
        </section>
      ) : null}
    </div>
  );
}

function docPayload(form: FormData) {
  return {
    title: String(form.get("title") || ""),
    slug: String(form.get("slug") || ""),
    category: String(form.get("category") || "Guide"),
    excerpt: String(form.get("excerpt") || ""),
    bodyMarkdown: String(form.get("bodyMarkdown") || ""),
    version: String(form.get("version") || "1.0.0"),
    productId: String(form.get("productId") || ""),
    productVersion: String(form.get("productVersion") || ""),
    visible: form.get("visible") === "on",
    sortOrder: Number(form.get("sortOrder") || 0),
  };
}

function releasePayload(form: FormData) {
  return {
    productId: String(form.get("productId") || ""),
    version: String(form.get("version") || ""),
    title: String(form.get("title") || ""),
    notes: String(form.get("notes") || ""),
    releaseType: String(form.get("releaseType") || "Release"),
    status: String(form.get("status") || "Draft"),
    isLatest: form.get("isLatest") === "on",
    publishedAt: String(form.get("publishedAt") || ""),
  };
}

function markLatest(items: ProductReleaseItem[], release: ProductReleaseItem) {
  if (!release.isLatest) return items;
  return items.map((item) => (item.productId === release.productId && item.id !== release.id ? { ...item, isLatest: false } : item));
}

async function jsonRequest(url: string, method: string, payload: unknown, setNotice: (message: string) => void) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    setNotice(result.message || "Request failed.");
    return null;
  }

  return result;
}

async function formRequest(url: string, method: string, payload: FormData, setNotice: (message: string) => void) {
  const response = await fetch(url, { method, body: payload });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    setNotice(result.message || "Request failed.");
    return null;
  }

  return result;
}

function DocFields({ doc, products }: { doc?: DocumentationArticleItem; products: ProductOption[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Field label="Title" name="title" defaultValue={doc?.title} required />
      <Field label="Slug" name="slug" defaultValue={doc?.slug} helper="Public URL: /docs/your-slug" required />
      <SelectField label="Category" name="category" defaultValue={doc?.category || "Guide"} options={docCategories} />
      <OptionSelect label="Linked product" name="productId" defaultValue={doc?.productId || ""} options={products} noneLabel="Platform / no product" />
      <Field label="Docs version" name="version" defaultValue={doc?.version || "1.0.0"} />
      <Field label="Product version" name="productVersion" defaultValue={doc?.productVersion || ""} />
      <Field label="Sort order" name="sortOrder" type="number" defaultValue={String(doc?.sortOrder ?? 0)} />
      <ToggleField label="Visible on public docs" name="visible" defaultChecked={doc?.visible ?? true} />
      <TextArea label="Excerpt" name="excerpt" defaultValue={doc?.excerpt} rows={3} className="lg:col-span-2" />
      <TextArea label="Body markdown" name="bodyMarkdown" defaultValue={doc?.bodyMarkdown} rows={14} className="font-mono lg:col-span-2" />
    </div>
  );
}

function ReleaseFields({ release, products }: { release?: ProductReleaseItem; products: ProductOption[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <OptionSelect label="Linked product" name="productId" defaultValue={release?.productId || ""} options={products} required />
      <Field label="Version" name="version" defaultValue={release?.version || ""} required />
      <Field label="Title" name="title" defaultValue={release?.title || ""} required />
      <SelectField label="Status" name="status" defaultValue={release?.status || "Draft"} options={releaseStatuses} />
      <SelectField label="Release type" name="releaseType" defaultValue={release?.releaseType || "Release"} options={releaseTypes} />
      <Field label="Published at" name="publishedAt" type="datetime-local" defaultValue={dateTimeLocalValue(release?.publishedAt)} />
      <ToggleField label="Mark as latest release" name="isLatest" defaultChecked={release?.isLatest ?? false} />
      <TextArea label="Release notes" name="notes" defaultValue={release?.notes} rows={8} className="lg:col-span-2" />
    </div>
  );
}

function DownloadFields({
  download,
  products,
  releases,
}: {
  download?: ProductDownloadItem;
  products: ProductOption[];
  releases: ProductReleaseItem[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <OptionSelect label="Linked product" name="productId" defaultValue={download?.productId || ""} options={products} required />
      <OptionSelect
        label="Linked release"
        name="releaseId"
        defaultValue={download?.releaseId || ""}
        options={releases.map((release) => ({ id: release.id, name: `${release.product.name} / v${release.version}`, slug: release.id, version: release.version }))}
        noneLabel="No release link"
      />
      <FileField label={download ? "Replace uploaded file" : "Upload file"} name="file" helper={download ? "Optional. Leave empty to keep the current private file." : "Optional if you enter an existing private storage key below."} />
      <Field label="Filename" name="filename" defaultValue={download?.filename || ""} helper="If uploading, this can be blank and will use the uploaded file name." />
      <SelectField label="File type" name="fileType" defaultValue={download?.fileType || "Other"} options={fileTypes} />
      <Field label="Version" name="version" defaultValue={download?.version || ""} required />
      <Field label="Private storage key" name="storageKey" defaultValue={download?.storageKey || ""} helper="Auto-filled after upload. Existing keys stay relative to LOCAL_STORAGE_ROOT." />
      <Field label="File size bytes" name="fileSize" type="number" defaultValue={String(download?.fileSize ?? 0)} />
      <Field label="SHA-256 checksum" name="checksum" defaultValue={download?.checksum || ""} className="lg:col-span-2" />
      <ToggleField label="Visible in customer portal" name="visible" defaultChecked={download?.visible ?? true} />
      <ToggleField label="Requires active license" name="requiresLicense" defaultChecked={download?.requiresLicense ?? true} />
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  helper,
  required = false,
  type = "text",
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  helper?: string;
  required?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input
        name={name}
        required={required}
        type={type}
        defaultValue={defaultValue || ""}
        className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60"
      />
      {helper ? <span className="text-xs leading-5 text-white/34">{helper}</span> : null}
    </label>
  );
}

function FileField({ label, name, helper }: { label: string; name: string; helper?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <span className="flex min-h-11 items-center gap-3 rounded-md border border-dashed border-white/12 bg-black/24 px-3 text-sm text-white/58">
        <Upload className="h-4 w-4 text-[#ff6262]" aria-hidden="true" />
        <input name={name} type="file" className="min-w-0 flex-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-black" />
      </span>
      {helper ? <span className="text-xs leading-5 text-white/34">{helper}</span> : null}
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows = 4,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
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

function OptionSelect({
  label,
  name,
  defaultValue,
  options,
  noneLabel = "None",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: ProductOption[];
  noneLabel?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue || ""}
        className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60"
      >
        <option value="">{noneLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({ label, name, defaultChecked }: { label: string; name: string; defaultChecked: boolean }) {
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

function SectionTitle({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10">
        <Icon className="h-5 w-5 text-[#ff8a8a]" aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-white/48">{description}</p>
      </div>
    </div>
  );
}

function ItemSummary({
  icon: Icon,
  title,
  meta,
  description,
  href,
}: {
  icon: LucideIcon;
  title: string;
  meta: string;
  description: string;
  href?: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
      <div className="flex min-w-0 gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04]">
          <Icon className="h-5 w-5 text-[#ff6262]" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff8a8a]">{meta}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/52">{description}</p>
        </div>
      </div>
      {href ? (
        <a href={href} className="inline-flex min-h-10 w-fit items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/62 transition hover:border-[#ff6262]/35 hover:text-white">
          <Link2 className="h-4 w-4" aria-hidden="true" />
          Open link
        </a>
      ) : null}
    </div>
  );
}

function FormActions({ onDelete, saveLabel, deleteLabel }: { onDelete: () => void; saveLabel: string; deleteLabel: string }) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <ActionButton>
        <Save className="h-4 w-4" /> {saveLabel}
      </ActionButton>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff5f6d]/30 bg-[#ff5f6d]/10 px-3 text-sm font-semibold text-[#ffd0dc] transition hover:bg-[#ff5f6d]/16"
      >
        <Trash2 className="h-4 w-4" /> {deleteLabel}
      </button>
    </div>
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

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="surface rounded-lg p-6 text-center">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/46">{description}</p>
    </div>
  );
}

function ActivityPanel({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] | React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className="surface rounded-lg p-5">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <div className="mt-5 grid gap-3">
        {hasChildren ? children : <p className="rounded-md border border-white/8 bg-white/[0.03] p-4 text-sm text-white/46">{empty}</p>}
      </div>
    </section>
  );
}

function ActivityItem({ title, meta, detail }: { title: string; meta: string; detail: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-white/42">{meta}</p>
      <p className="mt-2 text-xs text-white/34">{detail}</p>
    </div>
  );
}

function dateTimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
}

function formatFileSize(bytes: number) {
  if (!bytes) return "No size recorded";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
