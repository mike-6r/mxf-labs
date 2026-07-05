"use client";

import { AlertTriangle, Check, Eye, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ProductOption = {
  slug: string;
  name: string;
};

type FieldConfig = {
  key: string;
  label: string;
  description?: string;
  type?: "text" | "textarea" | "toggle" | "select";
  options?: Array<{ label: string; value: string }>;
};

const sections: Array<{ id: string; title: string; description: string; fields: FieldConfig[] }> = [
  {
    id: "brand",
    title: "Brand",
    description: "Core identity, contact points, and public social links.",
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
    id: "home",
    title: "Homepage",
    description: "Hero copy, calls to action, featured product, and section visibility.",
    fields: [
      { key: "home.hero_badge", label: "Hero badge" },
      { key: "home.hero_headline", label: "Hero headline" },
      { key: "home.hero_subheadline", label: "Hero subheadline", type: "textarea" },
      { key: "home.hero_intro", label: "Hero intro", type: "textarea" },
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
    id: "navigation",
    title: "Navigation",
    description: "Control visible nav/footer labels. Reorder by changing line order.",
    fields: [
      { key: "nav.enabled_items", label: "Enabled nav items", description: "Comma-separated labels: Products, Docs, Projects, Support" },
      { key: "footer.products", label: "Footer products", type: "textarea", description: "One link per line: Label|/url" },
    ],
  },
  {
    id: "products",
    title: "Products Display",
    description: "Product shelf layout and public display toggles.",
    fields: [
      { key: "products.featured_slug", label: "Featured product", type: "select" },
      {
        key: "products.card_layout",
        label: "Product card layout",
        type: "select",
        options: [
          { label: "Flagship + grid", value: "flagship-grid" },
          { label: "Compact grid", value: "compact-grid" },
        ],
      },
      { key: "products.show_pricing", label: "Show pricing", type: "toggle" },
      { key: "products.show_coming_soon", label: "Show coming soon products", type: "toggle" },
    ],
  },
  {
    id: "portal",
    title: "Portal Display",
    description: "Customer-facing portal copy and support actions.",
    fields: [
      { key: "portal.greeting", label: "Portal greeting text" },
      { key: "portal.empty_state", label: "Portal empty state text", type: "textarea" },
      { key: "portal.support_cta", label: "Support CTA text" },
      { key: "portal.discord_cta", label: "Discord CTA text" },
    ],
  },
  {
    id: "legal",
    title: "Legal",
    description: "Launch-ready legal copy. Replace drafts with reviewed policy text before production.",
    fields: [
      { key: "legal.terms", label: "Terms text", type: "textarea" },
      { key: "legal.privacy", label: "Privacy text", type: "textarea" },
      { key: "legal.refunds", label: "Refund policy text", type: "textarea" },
      { key: "legal.support_sla", label: "Support SLA", type: "textarea" },
    ],
  },
  {
    id: "discord",
    title: "Discord Server Setup Text",
    description: "Setup embed and panel copy used by future Discord customization surfaces.",
    fields: [
      { key: "discord.setup.welcome_embed", label: "Welcome embed copy", type: "textarea" },
      { key: "discord.setup.faq_embed", label: "FAQ embed copy", type: "textarea" },
      { key: "discord.setup.support_panel", label: "Support panel copy", type: "textarea" },
      { key: "discord.setup.product_panel", label: "Product panel copy", type: "textarea" },
      { key: "discord.setup.ticket_panel", label: "Ticket panel copy", type: "textarea" },
      { key: "discord.setup.giveaway_embed", label: "Giveaway embed copy", type: "textarea" },
      { key: "discord.setup.suggestion_embed", label: "Suggestion embed copy", type: "textarea" },
      { key: "discord.role.customer_label", label: "Customer role label" },
      { key: "discord.role.verified_label", label: "Verified role label" },
      { key: "discord.role.premium_support_label", label: "Premium support role label" },
      { key: "discord.role.beta_tester_label", label: "Beta tester role label" },
    ],
  },
];

export function CustomizeManager({
  settings,
  products,
}: {
  settings: Record<string, string>;
  products: ProductOption[];
}) {
  const [active, setActive] = useState(sections[0].id);
  const [values, setValues] = useState(settings);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [dirty, setDirty] = useState(false);
  const activeSection = sections.find((section) => section.id === active) || sections[0];

  const productOptions = useMemo(
    () => products.map((product) => ({ label: product.name, value: product.slug })),
    [products],
  );

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setStatus("idle");
  }

  async function save() {
    setStatus("saving");
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: Object.entries(values).map(([key, value]) => ({ key, value })),
      }),
    });

    setStatus(response.ok ? "saved" : "error");
    if (response.ok) setDirty(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[16rem_1fr]">
      <aside className="surface h-fit rounded-lg p-3 xl:sticky xl:top-28">
        <div className="grid gap-1">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActive(section.id)}
              className={cn(
                "rounded-md px-3 py-2.5 text-left text-sm font-semibold transition",
                active === section.id ? "bg-white text-black" : "text-white/56 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              {section.title}
            </button>
          ))}
        </div>
        {dirty ? (
          <div className="mt-4 rounded-md border border-[#f7b955]/20 bg-[#f7b955]/8 p-3 text-xs leading-5 text-[#ffe1a3]">
            Unsaved changes are waiting.
          </div>
        ) : null}
      </aside>

      <section className="surface-strong rounded-lg p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Customize</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{activeSection.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">{activeSection.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/" target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/70 transition hover:border-[#ff6262]/35 hover:text-white">
              <Eye className="h-4 w-4" aria-hidden="true" />
              Preview site
            </a>
            <button
              type="button"
              onClick={save}
              disabled={status === "saving"}
              className="button-shine inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black disabled:opacity-60"
            >
              {status === "saved" ? <Check className="relative z-10 h-4 w-4" aria-hidden="true" /> : <Save className="relative z-10 h-4 w-4" aria-hidden="true" />}
              <span className="relative z-10">{status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Save changes"}</span>
            </button>
          </div>
        </div>

        {status === "error" ? (
          <div className="mt-5 flex items-start gap-3 rounded-md border border-[#ff5f6d]/24 bg-[#ff5f6d]/10 p-3 text-sm text-[#ffd0dc]">
            <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
            Unable to save customization settings.
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {activeSection.fields.map((field) => (
            <FieldControl
              key={field.key}
              field={field}
              value={values[field.key] || ""}
              onChange={(value) => update(field.key, value)}
              productOptions={productOptions}
            />
          ))}
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
  productOptions: Array<{ label: string; value: string }>;
}) {
  if (field.type === "toggle") {
    return (
      <label className="flex min-h-12 items-center justify-between gap-4 rounded-md border border-white/10 bg-black/24 px-3 py-3">
        <span>
          <span className="block text-sm font-semibold text-white">{field.label}</span>
          {field.description ? <span className="mt-1 block text-xs text-white/40">{field.description}</span> : null}
        </span>
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
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {field.description ? <span className="text-xs text-white/40">{field.description}</span> : null}
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="grid gap-2 md:col-span-2">
        <span className="text-sm font-semibold text-white">{field.label}</span>
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={5} className="rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#ff6262]/60" />
        {field.description ? <span className="text-xs text-white/40">{field.description}</span> : null}
      </label>
    );
  }

  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-white">{field.label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60" />
      {field.description ? <span className="text-xs text-white/40">{field.description}</span> : null}
    </label>
  );
}
