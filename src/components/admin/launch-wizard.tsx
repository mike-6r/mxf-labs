"use client";

import { AlertTriangle, Check, Eye, Rocket, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { emailTemplateKey } from "@/lib/email/template-definitions";
import type { ProductReadiness, CompletionArea } from "@/lib/launch/readiness";
import type { ProductionEnvItem, SecretRotationWarning } from "@/lib/launch/production";
import { PRODUCT_STATUS_OPTIONS } from "@/lib/products/status";
import { cn } from "@/lib/utils";

type ProductOption = {
  label: string;
  value: string;
};

type LaunchProduct = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  featuresJson: string;
  faqJson: string;
  roadmapJson: string;
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

type ProductValues = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  price: string;
  priceCents: string;
  currency: string;
  status: string;
  visible: boolean;
  defaultActivationLimit: string;
  licenseRules: string;
  documentationLink: string;
  supportLink: string;
  purchaseButtonText: string;
  faq: string;
  changelog: string;
  features: string;
  roadmap: string;
  category: string;
  version: string;
  icon: string;
};

type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "toggle" | "select";
  description?: string;
  options?: Array<{ label: string; value: string }>;
};

const emailTemplateFields = ["purchase_receipt", "license_delivery", "support_update"].flatMap((id) => [
  emailTemplateKey(id, "subject"),
  emailTemplateKey(id, "body"),
]);

const steps: Array<{
  id: string;
  title: string;
  description: string;
  fields?: FieldConfig[];
}> = [
  {
    id: "brand",
    title: "Brand Identity",
    description: "Core launch identity and public contact points.",
    fields: [
      { key: "brand.name", label: "Site name" },
      { key: "brand.logo_text", label: "Logo text" },
      { key: "brand.tagline", label: "Tagline" },
      { key: "brand.short_description", label: "Short description", type: "textarea" },
      { key: "support.email", label: "Support email" },
      { key: "contact.email", label: "Contact email" },
      { key: "social.discord_invite", label: "Discord invite" },
      { key: "social.github", label: "GitHub link" },
    ],
  },
  {
    id: "homepage",
    title: "Homepage",
    description: "Hero copy, calls to action, featured product, and section visibility.",
    fields: [
      { key: "home.hero_headline", label: "Hero headline" },
      { key: "home.hero_subheadline", label: "Hero subheadline", type: "textarea" },
      { key: "home.primary_cta_text", label: "Primary CTA text" },
      { key: "home.primary_cta_link", label: "Primary CTA link" },
      { key: "home.secondary_cta_text", label: "Secondary CTA text" },
      { key: "home.secondary_cta_link", label: "Secondary CTA link" },
      { key: "home.featured_product", label: "Featured product", type: "select" },
      { key: "home.show_stats", label: "Show stats", type: "toggle" },
      { key: "home.show_projects", label: "Show projects", type: "toggle" },
      { key: "home.show_testimonials", label: "Show testimonials", type: "toggle" },
      { key: "home.show_announcements", label: "Show announcements", type: "toggle" },
    ],
  },
  {
    id: "products",
    title: "Products",
    description: "Launch-facing product content, pricing, licensing, docs, support, and publish status.",
  },
  {
    id: "legal",
    title: "Legal",
    description: "Replace draft legal copy and mark policies ready for legal review.",
    fields: [
      { key: "legal.terms", label: "Terms of Service", type: "textarea" },
      { key: "legal.privacy", label: "Privacy Policy", type: "textarea" },
      { key: "legal.refunds", label: "Refund Policy", type: "textarea" },
      { key: "legal.support_sla", label: "Support SLA", type: "textarea" },
    ],
  },
  {
    id: "discord",
    title: "Discord",
    description: "Setup embeds, product panels, ticket panels, and role sync labels.",
    fields: [
      { key: "discord.setup.welcome_embed", label: "Welcome embed", type: "textarea" },
      { key: "discord.setup.faq_embed", label: "FAQ embed", type: "textarea" },
      { key: "discord.setup.support_panel", label: "Support panel", type: "textarea" },
      { key: "discord.setup.ticket_panel", label: "Ticket panel", type: "textarea" },
      { key: "discord.setup.product_panel", label: "Product panel", type: "textarea" },
      { key: "discord.setup.giveaway_embed", label: "Giveaway embed", type: "textarea" },
      { key: "discord.setup.suggestion_embed", label: "Suggestion embed", type: "textarea" },
      { key: "discord.role.customer_label", label: "Customer role label" },
      { key: "discord.role.verified_label", label: "Verified role label" },
      { key: "discord.role.premium_support_label", label: "Premium support role label" },
      { key: "discord.role.beta_tester_label", label: "Beta tester role label" },
    ],
  },
  {
    id: "emails",
    title: "Emails",
    description: "Sender settings and launch-critical transactional copy.",
    fields: [
      { key: "email.from_email", label: "From email" },
      { key: "support.email", label: "Support email" },
      { key: emailTemplateKey("purchase_receipt", "subject"), label: "Purchase receipt subject" },
      { key: emailTemplateKey("purchase_receipt", "body"), label: "Purchase receipt body", type: "textarea" },
      { key: emailTemplateKey("license_delivery", "subject"), label: "License delivery subject" },
      { key: emailTemplateKey("license_delivery", "body"), label: "License delivery body", type: "textarea" },
      { key: emailTemplateKey("support_update", "subject"), label: "Support update subject" },
      { key: emailTemplateKey("support_update", "body"), label: "Support update body", type: "textarea" },
    ],
  },
  {
    id: "production",
    title: "Production Config",
    description: "Provider, database, storage, Discord, payments, and email readiness.",
  },
  {
    id: "checklist",
    title: "Launch Checklist",
    description: "Final go-live blockers, optional polish, and content-mode safety.",
  },
];

function parseJsonList(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.join("\n") : "";
  } catch {
    return "";
  }
}

function splitList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function productValues(product: LaunchProduct): ProductValues {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    price: product.price,
    priceCents: String(product.priceCents),
    currency: product.currency,
    status: product.status,
    visible: product.visible,
    defaultActivationLimit: String(product.defaultActivationLimit),
    licenseRules: parseJsonList(product.licenseRulesJson),
    documentationLink: product.documentationLink || "",
    supportLink: product.supportLink || "",
    purchaseButtonText: product.purchaseButtonText,
    faq: parseJsonList(product.faqJson),
    changelog: parseJsonList(product.changelogJson),
    features: parseJsonList(product.featuresJson),
    roadmap: parseJsonList(product.roadmapJson),
    category: product.category,
    version: product.version,
    icon: product.icon,
  };
}

function productPayload(values: ProductValues) {
  return {
    name: values.name,
    slug: values.slug,
    shortDescription: values.shortDescription,
    fullDescription: values.fullDescription,
    price: values.price,
    priceCents: values.priceCents,
    currency: values.currency,
    status: values.status,
    visible: values.visible,
    defaultActivationLimit: values.defaultActivationLimit,
    licenseRules: splitList(values.licenseRules),
    documentationLink: values.documentationLink,
    supportLink: values.supportLink,
    purchaseButtonText: values.purchaseButtonText,
    faq: splitList(values.faq),
    changelog: splitList(values.changelog),
    features: splitList(values.features),
    roadmap: splitList(values.roadmap),
    techStack: [],
    screenshots: [],
    category: values.category,
    version: values.version,
    icon: values.icon,
  };
}

export function LaunchWizard({
  settings,
  products,
  productReadiness,
  areas,
  productionEnv,
  secretWarnings,
  contentMode,
  contentModeWarnings,
}: {
  settings: Record<string, string>;
  products: LaunchProduct[];
  productReadiness: ProductReadiness[];
  areas: CompletionArea[];
  productionEnv: ProductionEnvItem[];
  secretWarnings: SecretRotationWarning[];
  contentMode: string;
  contentModeWarnings: string[];
}) {
  const [active, setActive] = useState(steps[0].id);
  const [values, setValues] = useState(settings);
  const [mode, setMode] = useState(contentMode);
  const [productItems, setProductItems] = useState<Record<string, ProductValues>>(() =>
    Object.fromEntries(products.map((product) => [product.id, productValues(product)])),
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [dirty, setDirty] = useState(false);
  const activeStep = steps.find((step) => step.id === active) || steps[0];
  const productOptions = useMemo(() => products.map((product) => ({ label: product.name, value: product.slug })), [products]);
  const readinessByProduct = useMemo(() => new Map(productReadiness.map((item) => [item.productId, item])), [productReadiness]);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function updateSetting(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setStatus("idle");
    setDirty(true);
  }

  function updateProduct(id: string, key: keyof ProductValues, value: string | boolean) {
    setProductItems((current) => ({ ...current, [id]: { ...current[id], [key]: value } }));
    setStatus("idle");
    setDirty(true);
  }

  async function saveSettingsForStep() {
    const keys = activeStep.fields?.map((field) => field.key) || [];
    if (activeStep.id === "emails") {
      keys.push("email.from_email", "support.email", ...emailTemplateFields);
    }
    if (!keys.length) return true;
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: Array.from(new Set(keys)).map((key) => ({ key, value: values[key] || "" })) }),
    });
    return response.ok;
  }

  async function saveProducts() {
    const responses = await Promise.all(
      Object.values(productItems).map((product) =>
        fetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productPayload(product)),
        }),
      ),
    );
    return responses.every((response) => response.ok);
  }

  async function saveCurrentStep() {
    setStatus("saving");
    const ok = active === "products" ? await saveProducts() : await saveSettingsForStep();
    setStatus(ok ? "saved" : "error");
    if (ok) setDirty(false);
  }

  async function switchMode(nextMode: "clean" | "production") {
    const confirmMessage =
      nextMode === "production"
        ? "Switch to production mode? Public content will be treated as launch-ready only."
        : "Switch to clean mode? Demo/test content will be hidden.";
    if (!window.confirm(confirmMessage)) return;
    setStatus("saving");
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: [{ key: "platform.content_mode", value: nextMode }] }),
    });
    if (response.ok) setMode(nextMode);
    setStatus(response.ok ? "saved" : "error");
  }

  async function markSecretsRotated() {
    if (!window.confirm("Mark secrets as rotated? Only do this after regenerating exposed/shared credentials in each provider dashboard.")) return;
    setStatus("saving");
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: [{ key: "launch.secrets_rotated", value: "true" }] }),
    });
    if (response.ok) {
      setValues((current) => ({ ...current, "launch.secrets_rotated": "true" }));
      setDirty(false);
    }
    setStatus(response.ok ? "saved" : "error");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[17rem_1fr]">
      <aside className="surface h-fit rounded-lg p-3 xl:sticky xl:top-28">
        <div className="grid gap-1">
          {steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActive(step.id)}
              className={cn(
                "rounded-md px-3 py-2.5 text-left text-sm font-semibold transition",
                active === step.id ? "bg-white text-black" : "text-white/56 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              <span className="mr-2 font-mono text-xs opacity-60">{index + 1}</span>
              {step.title}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-md border border-white/8 bg-black/20 p-3">
          <p className="font-mono text-xs text-[#ff6262]">Content mode</p>
          <p className="mt-1 text-sm font-semibold capitalize text-white">{mode}</p>
        </div>
      </aside>

      <section className="surface-strong rounded-lg p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Launch Wizard</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{activeStep.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">{activeStep.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/" target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/70 transition hover:border-[#ff6262]/35 hover:text-white">
              <Eye className="h-4 w-4" aria-hidden="true" />
              Preview site
            </a>
            {active !== "production" && active !== "checklist" ? (
              <button type="button" onClick={saveCurrentStep} disabled={status === "saving"} className="button-shine inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black disabled:opacity-60">
                {status === "saved" ? <Check className="relative z-10 h-4 w-4" aria-hidden="true" /> : <Save className="relative z-10 h-4 w-4" aria-hidden="true" />}
                <span className="relative z-10">{status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Save step"}</span>
              </button>
            ) : null}
          </div>
        </div>

        {dirty ? <p className="mt-4 rounded-md border border-[#f7b955]/20 bg-[#f7b955]/8 p-3 text-sm text-[#ffe1a3]">Unsaved launch changes are waiting.</p> : null}
        {status === "error" ? <p className="mt-4 rounded-md border border-[#ff5f6d]/24 bg-[#ff5f6d]/10 p-3 text-sm text-[#ffd0dc]">Unable to save this step. Check required fields and URLs.</p> : null}

        <div className="mt-6">
          {activeStep.fields ? (
            <div className="grid gap-4 md:grid-cols-2">
              {activeStep.fields.map((field) => (
                <FieldControl
                  key={field.key}
                  field={field}
                  value={values[field.key] || ""}
                  onChange={(value) => updateSetting(field.key, value)}
                  productOptions={productOptions}
                />
              ))}
            </div>
          ) : null}

          {active === "products" ? (
            <div className="grid gap-4">
              {Object.values(productItems).map((product) => {
                const readiness = readinessByProduct.get(product.id);
                return (
                  <details key={product.id} className="rounded-lg border border-white/8 bg-black/18 p-4">
                    <summary className="cursor-pointer list-none">
                      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">{product.status} / {product.visible ? "Visible" : "Hidden"}</p>
                          <h3 className="mt-2 text-xl font-semibold text-white">{product.name}</h3>
                          <p className="mt-1 text-sm text-white/50">{product.shortDescription}</p>
                        </div>
                        <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/68">
                          {readiness?.score || 0}% ready
                        </span>
                      </div>
                    </summary>
                    <ProductFields product={product} readiness={readiness} update={updateProduct} />
                  </details>
                );
              })}
            </div>
          ) : null}

          {active === "production" ? <ProductionStatus env={productionEnv} warnings={secretWarnings} /> : null}
          {active === "checklist" ? (
            <LaunchChecklist
              areas={areas}
              warnings={[...contentModeWarnings, ...secretWarnings.map((warning) => warning.label)]}
              contentMode={mode}
              switchMode={switchMode}
              secretsRotated={values["launch.secrets_rotated"] === "true"}
              markSecretsRotated={markSecretsRotated}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
  productOptions,
}: {
  field: FieldConfig;
  value: string;
  onChange: (value: string) => void;
  productOptions: ProductOption[];
}) {
  if (field.type === "toggle") {
    return (
      <label className="flex min-h-12 items-center justify-between gap-4 rounded-md border border-white/10 bg-black/24 px-3 py-3">
        <span className="text-sm font-semibold text-white">{field.label}</span>
        <input type="checkbox" checked={value === "true"} onChange={(event) => onChange(event.target.checked ? "true" : "false")} />
      </label>
    );
  }

  if (field.type === "select") {
    const options = field.options || productOptions;
    return (
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-white">{field.label}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60">
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="grid gap-2 md:col-span-2">
        <span className="text-sm font-semibold text-white">{field.label}</span>
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={6} className="rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#ff6262]/60" />
      </label>
    );
  }

  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-white">{field.label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60" />
    </label>
  );
}

function ProductFields({
  product,
  readiness,
  update,
}: {
  product: ProductValues;
  readiness?: ProductReadiness;
  update: (id: string, key: keyof ProductValues, value: string | boolean) => void;
}) {
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_18rem]">
      <div className="grid gap-4 md:grid-cols-2">
        <ProductInput label="Name" value={product.name} onChange={(value) => update(product.id, "name", value)} />
        <ProductInput label="Slug" value={product.slug} onChange={(value) => update(product.id, "slug", value)} />
        <ProductInput label="Short description" value={product.shortDescription} onChange={(value) => update(product.id, "shortDescription", value)} className="md:col-span-2" />
        <ProductTextArea label="Full description" value={product.fullDescription} onChange={(value) => update(product.id, "fullDescription", value)} />
        <ProductTextArea label="Features" value={product.features} onChange={(value) => update(product.id, "features", value)} />
        <ProductInput label="Price label" value={product.price} onChange={(value) => update(product.id, "price", value)} />
        <ProductInput label="Price cents" value={product.priceCents} onChange={(value) => update(product.id, "priceCents", value)} />
        <ProductInput label="Currency" value={product.currency} onChange={(value) => update(product.id, "currency", value)} />
        <ProductInput label="Activation limit" value={product.defaultActivationLimit} onChange={(value) => update(product.id, "defaultActivationLimit", value)} />
        <ProductTextArea label="License rules" value={product.licenseRules} onChange={(value) => update(product.id, "licenseRules", value)} />
        <ProductTextArea label="FAQ" value={product.faq} onChange={(value) => update(product.id, "faq", value)} />
        <ProductTextArea label="Changelog" value={product.changelog} onChange={(value) => update(product.id, "changelog", value)} />
        <ProductInput label="Docs link" value={product.documentationLink} onChange={(value) => update(product.id, "documentationLink", value)} />
        <ProductInput label="Support link" value={product.supportLink} onChange={(value) => update(product.id, "supportLink", value)} />
        <ProductInput label="Purchase button" value={product.purchaseButtonText} onChange={(value) => update(product.id, "purchaseButtonText", value)} />
        <label className="grid gap-2">
          <span className="text-xs font-semibold text-white/70">Status</span>
          <select value={product.status} onChange={(event) => update(product.id, "status", event.target.value)} className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60">
            {PRODUCT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-white/10 bg-black/24 px-3 py-3">
          <span className="text-sm font-semibold text-white/72">Visible</span>
          <input type="checkbox" checked={product.visible} onChange={(event) => update(product.id, "visible", event.target.checked)} />
        </label>
      </div>
      <aside className="surface h-fit rounded-lg p-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Readiness</p>
        <p className="mt-3 text-3xl font-semibold text-white">{readiness?.score || 0}%</p>
        <div className="mt-4 grid gap-2">
          {readiness?.checks.map((check) => (
            <div key={check.label} className="flex items-center justify-between gap-3 rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
              <span className="text-xs text-white/58">{check.label}</span>
              <span className={cn("text-xs font-semibold", check.ready ? "text-[#ffd8d8]" : check.critical ? "text-[#ffd0dc]" : "text-[#ffe1a3]")}>
                {check.ready ? "Ready" : check.critical ? "Missing" : "Review"}
              </span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function ProductInput({ label, value, onChange, className }: { label: string; value: string; onChange: (value: string) => void; className?: string }) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60" />
    </label>
  );
}

function ProductTextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 md:col-span-2">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <textarea value={value} rows={4} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#ff6262]/60" />
    </label>
  );
}

function ProductionStatus({ env, warnings }: { env: ProductionEnvItem[]; warnings: SecretRotationWarning[] }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {env.map((item) => (
          <article key={item.key} className="rounded-lg border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-[#ff6262]">{item.key}</p>
                <h3 className="mt-2 text-sm font-semibold text-white">{item.label}</h3>
              </div>
              <span className={cn("rounded-md border px-2 py-1 text-[11px] font-semibold", item.status === "configured" ? "border-[#ff6262]/25 bg-[#ff6262]/10 text-[#ffd8d8]" : item.required ? "border-[#ff5f6d]/25 bg-[#ff5f6d]/10 text-[#ffd0dc]" : "border-white/10 bg-white/[0.04] text-white/50")}>
                {item.status === "configured" ? "Configured" : item.required ? "Missing" : "Optional"}
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-white/42">{item.powers}</p>
          </article>
        ))}
      </div>
      <section className="rounded-lg border border-[#f7b955]/20 bg-[#f7b955]/8 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#ffe1a3]">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Secret rotation checklist
        </div>
        <div className="mt-3 grid gap-2">
          {warnings.map((warning) => (
            <p key={warning.id} className="text-xs leading-5 text-[#ffe1a3]/80">{warning.label}: {warning.detail}</p>
          ))}
        </div>
      </section>
    </div>
  );
}

function LaunchChecklist({
  areas,
  warnings,
  contentMode,
  switchMode,
  secretsRotated,
  markSecretsRotated,
}: {
  areas: CompletionArea[];
  warnings: string[];
  contentMode: string;
  switchMode: (mode: "clean" | "production") => void;
  secretsRotated: boolean;
  markSecretsRotated: () => void;
}) {
  const required = [
    ["Brand complete", areas.find((area) => area.id === "brand")?.status === "Complete"],
    ["Homepage complete", areas.find((area) => area.id === "homepage")?.status === "Complete"],
    ["At least one product published", areas.find((area) => area.id === "products")?.status === "Complete"],
    ["Legal pages complete", areas.find((area) => area.id === "legal")?.status === "Complete"],
    ["Payment provider configured", areas.find((area) => area.id === "payments")?.status === "Complete"],
    ["Email templates complete", areas.find((area) => area.id === "emails")?.status === "Complete"],
    ["Discord copy complete", areas.find((area) => area.id === "discord")?.status === "Complete"],
    ["Downloads configured", areas.find((area) => area.id === "downloads")?.status === "Complete"],
    ["Secrets rotated", secretsRotated],
    ["CONTENT_MODE=production", contentMode === "production"],
  ] as const;
  const optional = ["Stripe live", "PayPal live", "GitHub link", "Discord invite", "Product screenshots", "Docs completed"];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
      <section className="rounded-lg border border-white/8 bg-black/18 p-4">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-[#ff6262]" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-white">Go Live Checklist</h3>
        </div>
        <div className="mt-4 grid gap-2">
          {required.map(([label, ready]) => (
            <div key={label} className="flex items-center justify-between rounded-md border border-white/8 bg-white/[0.03] p-3">
              <span className="text-sm text-white/68">{label}</span>
              <span className={ready ? "text-sm font-semibold text-[#ffd8d8]" : "text-sm font-semibold text-[#ffd0dc]"}>{ready ? "Ready" : "Missing"}</span>
            </div>
          ))}
        </div>
      </section>
      <aside className="grid h-fit gap-4">
        <section className="rounded-lg border border-[#f7b955]/20 bg-[#f7b955]/8 p-4">
          <h3 className="text-sm font-semibold text-[#ffe1a3]">Launch warnings</h3>
          <div className="mt-3 grid gap-2">
            {warnings.length ? warnings.map((warning) => <p key={warning} className="text-xs leading-5 text-[#ffe1a3]/80">{warning}</p>) : <p className="text-xs text-[#ffd8d8]">No launch warnings detected.</p>}
          </div>
        </section>
        <section className="rounded-lg border border-white/8 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold text-white">Content Mode Safety</h3>
          <p className="mt-2 text-xs leading-5 text-white/46">Current mode: {contentMode}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => switchMode("clean")} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/68">Switch to Clean Mode</button>
            <button type="button" onClick={() => switchMode("production")} className="rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10 px-3 py-2 text-xs font-semibold text-[#ffd8d8]">Switch to Production Mode</button>
          </div>
        </section>
        <section className="rounded-lg border border-white/8 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold text-white">Secret Rotation</h3>
          <p className="mt-2 text-xs leading-5 text-white/46">{secretsRotated ? "Marked complete." : "Rotate exposed/shared provider credentials before production."}</p>
          <button type="button" onClick={markSecretsRotated} className="mt-3 rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10 px-3 py-2 text-xs font-semibold text-[#ffd8d8]">
            Mark Secrets Rotated
          </button>
        </section>
        <section className="rounded-lg border border-white/8 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold text-white">Optional polish</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {optional.map((item) => (
              <span key={item} className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-xs text-white/46">{item}</span>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
