import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, CheckCircle2, LifeBuoy, Sparkles } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { ProductFeatureExplorer, type ProductFeatureCategory } from "@/components/products/product-feature-explorer";
import { ProductIconPanel } from "@/components/products/product-icon-artwork";
import { ProductResourcesTabs } from "@/components/products/product-resources-tabs";
import { ProductShowcaseGallery } from "@/components/products/product-showcase-gallery";
import { ButtonLink } from "@/components/ui/button-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPublicProduct } from "@/lib/db/public";
import { prisma } from "@/lib/db/prisma";
import { getBooleanSetting } from "@/lib/db/settings";
import { productCheckoutReady } from "@/lib/payments/readiness";
import { publicPriceLabel } from "@/lib/pricing";
import { productProgressColor, productProgressValue, shouldShowProductProgress } from "@/lib/products/progress";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

type PublicProduct = NonNullable<Awaited<ReturnType<typeof getPublicProduct>>>;
type SectionKey = "overview" | "features" | "showcase" | "documentation" | "licensing" | "roadmap" | "faq";

const defaultSectionOrder: SectionKey[] = ["overview", "features", "showcase", "documentation", "licensing", "roadmap", "faq"];
const sectionLabels: Record<SectionKey, string> = {
  overview: "Overview",
  features: "Features",
  showcase: "Showcase",
  documentation: "Documentation",
  licensing: "Licensing",
  roadmap: "Roadmap",
  faq: "FAQ",
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.seo.title || product.name,
    description: product.seo.description || product.description,
    openGraph: product.seo.image ? { images: [{ url: product.seo.image }] } : undefined,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  const productRecord = await prisma.product.findUnique({
    where: { slug },
    include: {
      documentation: { where: { visible: true }, orderBy: { sortOrder: "asc" }, take: 8 },
      changelogEntries: { where: { visible: true }, orderBy: { publishedAt: "desc" }, take: 8 },
      releases: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });

  if (!product) {
    notFound();
  }

  if (productRecord && (await getBooleanSetting("analytics.product_views.enabled"))) {
    const headerStore = await headers();
    await prisma.productView.create({
      data: {
        productId: productRecord.id,
        source: headerStore.get("referer"),
        ipAddress: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        userAgent: headerStore.get("user-agent"),
      },
    });
  }

  const docs = productRecord?.documentation || [];
  const changelogEntries = productRecord?.changelogEntries || [];
  const releases = productRecord?.releases || [];
  const canCheckout = productRecord ? productCheckoutReady(productRecord) : false;
  const activationLimit = productRecord?.defaultActivationLimit || 1;
  const showcaseImages = [
    ...(product.media.showcaseImages || []).map((src, index) => ({ src, caption: product.media.showcaseCaptions[index] || `Showcase image ${index + 1}` })),
    ...(product.media.galleryImages || []).map((src, index) => ({ src, caption: product.media.galleryCaptions[index] || `Gallery image ${index + 1}` })),
  ];
  const featureCategories = resolveFeatureCategories(product);
  const highlights = sellingPoints(product).slice(0, 4);
  const hasResources = Boolean(docs.length || product.documentationLink || releases.length || changelogEntries.length || product.changelog.length);
  const hasChangelog = Boolean(changelogEntries.length || product.changelog.length);
  const sectionTitles = product.display.detailSectionTitles || {};
  const hiddenSections = new Set(product.display.detailHiddenSections || []);
  const enabledTabs = new Set(product.display.detailTabs?.length ? product.display.detailTabs : ["overview", "features", "showcase", "documentation", "licensing", "roadmap", "faq", "changelog"]);
  const sectionOrder = resolveSectionOrder(product.display.detailSectionOrder);

  const sections: Record<SectionKey, ReactNode | null> = {
    overview: sectionAllowed("overview", enabledTabs, hiddenSections) ? (
      <Reveal key="overview" id="overview" className="scroll-mt-32">
        <ProductSection
          eyebrow="Overview"
          title={sectionTitle(sectionTitles, "overview", "Built for real operators.")}
          description="The essentials, stripped down to what matters before someone buys or joins the roadmap."
        >
          <OverviewPanel product={product} activationLimit={activationLimit} highlights={highlights} />
        </ProductSection>
      </Reveal>
    ) : null,
    features: sectionAllowed("features", enabledTabs, hiddenSections) && featureCategories.length ? (
      <Reveal key="features" id="features" className="scroll-mt-32">
        <ProductSection
          eyebrow="Features"
          title={sectionTitle(sectionTitles, "features", "Explore the system without the wall of text.")}
          description="Features are grouped, searchable, and collapsed by default so the page stays easy to scan."
        >
          <ProductFeatureExplorer
            categories={featureCategories}
            accentColor={product.accentColor}
            initialLimit={product.display.featurePaginationLimit || 8}
          />
        </ProductSection>
      </Reveal>
    ) : null,
    showcase: sectionAllowed("showcase", enabledTabs, hiddenSections) && showcaseImages.length ? (
      <Reveal key="showcase" id="showcase" className="scroll-mt-32">
        <ProductSection
          eyebrow="Showcase"
          title={sectionTitle(sectionTitles, "showcase", "Configured product visuals.")}
          description="Real screenshots and media appear here only when they are uploaded for this specific product."
        >
          <ProductShowcaseGallery images={showcaseImages} title={product.name} />
        </ProductSection>
      </Reveal>
    ) : null,
    documentation: sectionAllowed("documentation", enabledTabs, hiddenSections) && hasResources ? (
      <Reveal key="documentation" id="documentation" className="scroll-mt-32">
        <ProductSection
          eyebrow="Resources"
          title={sectionTitle(sectionTitles, "documentation", "Docs, releases, and changelog in one place.")}
          description="Support material is tabbed instead of stacked, so buyers can jump straight to the detail they need."
        >
          <ProductResourcesTabs
            docs={docs}
            documentationLink={product.documentationLink}
            releases={releases}
            changelogEntries={changelogEntries}
            productChangelog={product.changelog}
          />
        </ProductSection>
      </Reveal>
    ) : null,
    licensing: sectionAllowed("licensing", enabledTabs, hiddenSections) && product.licenseRules.length ? (
      <Reveal key="licensing" id="licensing" className="scroll-mt-32">
        <ProductSection
          eyebrow="Licensing"
          title={sectionTitle(sectionTitles, "licensing", "Ownership rules without the policy dump.")}
          description="Activation and license terms stay compact until someone wants to inspect them."
        >
          <LicensingPanel product={product} activationLimit={activationLimit} />
        </ProductSection>
      </Reveal>
    ) : null,
    roadmap: sectionAllowed("roadmap", enabledTabs, hiddenSections) && product.roadmap.length ? (
      <Reveal key="roadmap" id="roadmap" className="scroll-mt-32">
        <ProductSection
          eyebrow="Roadmap"
          title={sectionTitle(sectionTitles, "roadmap", "What is planned next.")}
          description="A compact roadmap for release direction, upcoming systems, and product maturity."
        >
          <Roadmap items={product.roadmap} />
        </ProductSection>
      </Reveal>
    ) : null,
    faq: sectionAllowed("faq", enabledTabs, hiddenSections) && product.faq.length ? (
      <Reveal key="faq" id="faq" className="scroll-mt-32">
        <ProductSection
          eyebrow="FAQ"
          title={sectionTitle(sectionTitles, "faq", "Answers before a ticket.")}
          description="Common questions stay tucked away until a visitor needs them."
        >
          <FaqList items={product.faq} />
        </ProductSection>
      </Reveal>
    ) : null,
  };

  const visibleSectionKeys = sectionOrder.filter((key) => sections[key]);
  const navItems = buildNavItems(visibleSectionKeys, enabledTabs, hasChangelog);

  return (
    <main className="px-5 pb-20 pt-14 md:px-8 md:pb-28 md:pt-20">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <ButtonLink href="/products" variant="ghost" className="mb-8 px-0" showArrow={false}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to products
          </ButtonLink>
        </Reveal>

        <Reveal>
          <section className="relative overflow-hidden rounded-lg bg-white/[0.025] p-5 premium-depth md:p-8 lg:p-10">
            <div className="absolute -right-24 top-8 h-80 w-80 rounded-full opacity-18 blur-3xl" style={{ background: product.accentColor }} />
            <div className="relative grid gap-10 lg:grid-cols-[0.88fr_0.78fr] lg:items-center">
              <div>
                <ProductMeta product={product} price={publicPriceLabel(product.price, product.priceCents)} />
                <h1 className="mt-6 max-w-4xl text-balance text-4xl font-semibold leading-[0.98] text-white md:text-6xl">
                  {product.name}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/64 md:text-lg">
                  {product.description}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <ProductActions product={product} canCheckout={canCheckout} />
                </div>
                <ProgressBar product={product} className="mt-8 max-w-xl" />
                <HeroFacts product={product} activationLimit={activationLimit} />
              </div>

              <ProductIconPanel product={product} variant="hero" className="min-h-[22rem] lg:min-h-[28rem]" />
            </div>
          </section>
        </Reveal>

        {navItems.length ? <ProductStickyNav items={navItems} /> : null}

        <div className="py-10 md:py-14">
          {visibleSectionKeys.map((key) => sections[key])}
        </div>
      </div>
    </main>
  );
}

function ProductMeta({ product, price }: { product: PublicProduct; price: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {product.display.badgeText ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#ffd8d8]">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {product.display.badgeText}
        </span>
      ) : null}
      <StatusBadge tone={product.accent}>{product.display.statusBadgeText || product.status}</StatusBadge>
      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/62">{price}</span>
      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/44">v{product.version || "0.1.0"}</span>
    </div>
  );
}

function HeroFacts({ product, activationLimit }: { product: PublicProduct; activationLimit: number }) {
  const facts = [
    ["Category", product.category || "Product"],
    ["Version", product.version || "0.1.0"],
    ["Activations", `${activationLimit} ${activationLimit === 1 ? "device" : "devices"}`],
  ];

  return (
    <div className="mt-9 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-3">
      {facts.map(([label, value]) => (
        <div key={label} className="bg-[#05070a]/72 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/32">{label}</p>
          <p className="mt-2 text-sm font-semibold text-white/74">{value}</p>
        </div>
      ))}
    </div>
  );
}

function ProductStickyNav({ items }: { items: Array<{ label: string; href: string }> }) {
  return (
    <div className="sticky top-20 z-30 mt-5 w-full max-w-full overflow-x-auto rounded-full border border-white/10 bg-[#05070a]/78 p-1.5 backdrop-blur-xl">
      <nav className="flex w-max min-w-full gap-1" aria-label="Product sections">
        {items.map((item) => (
          <a key={`${item.label}-${item.href}`} href={item.href} className="rounded-full px-4 py-2 text-sm font-semibold text-white/48 transition hover:bg-white/[0.055] hover:text-white">
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

function ProductSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-white/8 py-12 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[0.72fr_1fr] lg:items-start">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffb0b0]">{eyebrow}</p>
          <h2 className="mt-4 max-w-xl text-balance text-3xl font-semibold text-white md:text-4xl">{title}</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/54">{description}</p>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

function OverviewPanel({
  product,
  activationLimit,
  highlights,
}: {
  product: PublicProduct;
  activationLimit: number;
  highlights: string[];
}) {
  const specs = specRows(product, activationLimit);

  return (
    <div className="grid gap-6">
      <div className="rounded-lg bg-white/[0.025] p-5">
        <p className="text-base leading-8 text-white/66">{product.fullDescription || product.description}</p>
        {highlights.length ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <div key={item} className="flex items-start gap-3 border-t border-white/10 pt-4 text-sm leading-6 text-white/58">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" style={{ color: product.accentColor }} />
                {item}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <SpecGrid rows={specs} />

      {product.tags.length ? (
        <div className="flex flex-wrap gap-2">
          {product.tags.slice(0, 12).map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/50">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SpecGrid({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="bg-[#05070a]/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/32">{label}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/70">{value}</p>
        </div>
      ))}
    </div>
  );
}

function LicensingPanel({ product, activationLimit }: { product: PublicProduct; activationLimit: number }) {
  const rows: Array<[string, string]> = [
    ["License type", product.priceCents > 0 ? "Commercial product license" : product.price.toLowerCase() === "free" ? "Free product access" : "Internal platform access"],
    ["Activation limit", `${activationLimit} ${activationLimit === 1 ? "activation" : "activations"}`],
    ["Version", product.version || "0.1.0"],
    ["Support", product.supportLink ? "Configured support path" : "Support ticket route"],
  ];

  return (
    <div className="grid gap-4">
      <SpecGrid rows={rows} />
      <details className="group rounded-lg border border-white/10 bg-white/[0.025] p-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-white">
          License rules
          <span className="text-[#ffb0b0] transition group-open:rotate-45">+</span>
        </summary>
        <div className="mt-5 grid gap-3">
          {product.licenseRules.map((rule) => (
            <p key={rule} className="border-t border-white/10 pt-3 text-sm leading-6 text-white/56">{rule}</p>
          ))}
        </div>
      </details>
    </div>
  );
}

function Roadmap({ items }: { items: string[] }) {
  return (
    <ol className="grid gap-3">
      {items.map((item, index) => (
        <li key={item} className="grid grid-cols-[auto_1fr] gap-4 rounded-md bg-white/[0.025] p-4">
          <span className="font-mono text-xs text-white/34">{String(index + 1).padStart(2, "0")}</span>
          <p className="text-sm leading-6 text-white/60">{item}</p>
        </li>
      ))}
    </ol>
  );
}

function FaqList({ items }: { items: string[] }) {
  return (
    <div className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-white/[0.025]">
      {items.map((item) => {
        const parsed = parseFaqItem(item);

        return (
          <details key={item} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-white">
              {parsed.question}
              <span className="text-[#ffb0b0] transition group-open:rotate-45">+</span>
            </summary>
            {parsed.answer ? <p className="mt-4 text-sm leading-6 text-white/56">{parsed.answer}</p> : null}
          </details>
        );
      })}
    </div>
  );
}

function ProgressBar({ product, className }: { product: PublicProduct; className?: string }) {
  if (!shouldShowProductProgress(product, "detail")) return null;

  const value = productProgressValue(product);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold text-white/56">{product.display.progressLabel || "Progress"}</p>
        <span className="font-mono text-xs text-white/42">{value}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: productProgressColor(product) }} />
      </div>
    </div>
  );
}

function ProductActions({ product, canCheckout }: { product: PublicProduct; canCheckout: boolean }) {
  const fallback = [
    {
      label: product.purchaseButtonText || "Contact",
      href: canCheckout ? `/checkout/${product.slug}` : `/support?product=${product.slug}`,
      style: "primary" as const,
    },
    {
      label: product.documentationLink ? "Documentation" : "Support",
      href: product.documentationLink || product.supportLink || `/support?product=${product.slug}`,
      style: "secondary" as const,
    },
  ];
  const buttons = product.buttons.length ? product.buttons : fallback;
  const normalizedButtons = buttons.length === 1 ? [...buttons, fallback[1]] : buttons;

  return (
    <>
      {normalizedButtons.slice(0, 2).map((button) => (
        <ButtonLink key={`${button.label}-${button.href}`} href={button.href || `/products/${product.slug}`} variant={button.style}>
          {button.style !== "primary" && /support/i.test(button.label) ? <LifeBuoy className="h-4 w-4" aria-hidden="true" /> : null}
          {button.style !== "primary" && /doc/i.test(button.label) ? <BookOpen className="h-4 w-4" aria-hidden="true" /> : null}
          {button.label}
        </ButtonLink>
      ))}
    </>
  );
}

function buildNavItems(sectionKeys: SectionKey[], enabledTabs: Set<string>, hasChangelog: boolean) {
  const items: Array<{ label: string; href: string }> = [];

  sectionKeys.forEach((key) => {
    items.push({ label: navTitle(key), href: `#${key}` });
    if (key === "documentation" && hasChangelog && enabledTabs.has("changelog")) {
      items.push({ label: "Changelog", href: "#changelog" });
    }
  });

  return items;
}

function sectionAllowed(key: SectionKey, enabledTabs: Set<string>, hiddenSections: Set<string>) {
  if (hiddenSections.has(key)) return false;
  if (key === "documentation") return enabledTabs.has("documentation") || enabledTabs.has("docs") || enabledTabs.has("changelog");
  return enabledTabs.has(key);
}

function sectionTitle(titles: Record<string, string>, key: SectionKey, fallback: string) {
  return titles[key] || fallback;
}

function navTitle(key: SectionKey) {
  if (key === "documentation") return "Documentation";
  return sectionLabels[key];
}

function resolveSectionOrder(configured: string[] | undefined): SectionKey[] {
  const valid = new Set(defaultSectionOrder);
  const configuredKeys = (configured || [])
    .map((item) => item.trim())
    .filter((item): item is SectionKey => valid.has(item as SectionKey));

  return [...configuredKeys, ...defaultSectionOrder.filter((key) => !configuredKeys.includes(key))];
}

function resolveFeatureCategories(product: PublicProduct): ProductFeatureCategory[] {
  const configured = (product.display.featureCategories || []).filter((category) => category.title && category.items.length);
  if (configured.length) return configured;

  const features = product.features.length ? product.features : product.highlightedFeatures;
  const categoryMap = new Map<string, string[]>();

  features.forEach((feature) => {
    const category = categoryForFeature(feature, product);
    categoryMap.set(category, [...(categoryMap.get(category) || []), feature]);
  });

  return Array.from(categoryMap.entries()).map(([title, items]) => ({ title, items }));
}

function categoryForFeature(feature: string, product: PublicProduct) {
  const text = `${feature} ${product.category} ${product.name}`.toLowerCase();

  if (/war|outpost|territory|faction|ftop|ptop|gang/.test(text)) return "War Systems";
  if (/analytics|stat|leaderboard|top|telemetry/.test(text)) return "Analytics";
  if (/season|reset|battle pass|quest|event|daily/.test(text)) return "Seasons";
  if (/yaml|config|permission|modular|menu|gui|upgrade/.test(text)) return "Configuration";
  if (/api|discord|dashboard|web|integration|hook|portal/.test(text)) return "Integrations";
  if (/mine|rank|prestige|rebirth|token|gem|crystal|pickaxe|generator|island|skill|crop|economy|bank|auction|minion/.test(text)) return "Progression";
  if (/ticket|application|moderation|verification|logging|automod|voice|role|welcome|poll|suggestion/.test(text)) return "Community Ops";
  return "Core Gameplay";
}

function specRows(product: PublicProduct, activationLimit: number): Array<[string, string]> {
  const stack = product.stack.length ? product.stack : ["Configured per product"];
  const java = stack.find((item) => /java/i.test(item)) || (stack.some((item) => /paper|minecraft/i.test(item)) ? "Java / Paper" : "Configured per product");
  const dependencies = stack.filter((item) => !/java/i.test(item)).slice(0, 3).join(", ") || "None listed";

  return [
    ["Version", product.version || "0.1.0"],
    ["Platform", product.category || "Digital Product"],
    ["Java version", java],
    ["Dependencies", dependencies],
    ["License type", product.priceCents > 0 ? "Commercial license" : product.price.toLowerCase() === "free" ? "Free access" : "Internal access"],
    ["Activation limit", `${activationLimit} ${activationLimit === 1 ? "device" : "devices"}`],
  ];
}

function parseFaqItem(item: string) {
  const questionEnd = item.indexOf("?");

  if (questionEnd === -1) {
    return {
      question: item,
      answer: "",
    };
  }

  return {
    question: item.slice(0, questionEnd + 1),
    answer: item.slice(questionEnd + 1).trim(),
  };
}

function sellingPoints(product: PublicProduct) {
  return product.highlightedFeatures.length
    ? product.highlightedFeatures
    : product.features.length
      ? product.features
      : product.stack.length
        ? product.stack
        : product.tags;
}
