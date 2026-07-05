import { ArrowUpRight, BookOpen, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/animations/reveal";
import { ProductIconPanel } from "@/components/products/product-icon-artwork";
import { ButtonLink } from "@/components/ui/button-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { DocsArtwork } from "@/components/visuals/product-artwork";

type HomeProduct = {
  slug: string;
  name: string;
  description: string;
  fullDescription?: string;
  features: string[];
  highlightedFeatures?: string[];
  tags?: string[];
  featureIcons?: string[];
  status: string;
  price: string;
  priceCents?: number;
  category?: string;
  version?: string;
  documentationLink?: string | null;
  purchaseButtonText?: string;
  icon?: string;
  accent: "cyan" | "lime" | "amber" | "rose";
  accentColor?: string;
  media?: {
    cardImage?: string;
    heroImage?: string;
    featuredImage?: string;
  };
  display?: {
    featured?: boolean;
    featuredOrder?: number;
    showFeaturedSection?: boolean;
    layoutTemplate?: string;
    badgeText?: string;
    statusBadgeText?: string;
    cardStyle?: string;
    heroStyle?: string;
    showProgress?: boolean;
    progressLabel?: string;
    progressValue?: number;
  };
  buttons?: Array<{
    label: string;
    href: string;
    style: "primary" | "secondary" | "ghost";
  }>;
};

export function HomeProductShowcase({ products }: { products: HomeProduct[] }) {
  const flagship = [...products]
    .filter((product) => product.display?.featured && product.display.showFeaturedSection !== false)
    .sort((a, b) => (a.display?.featuredOrder || 0) - (b.display?.featuredOrder || 0))[0] || products[0];
  const secondary = products
    .filter((product) => product.slug !== flagship?.slug)
    .sort((a, b) => (a.display?.featuredOrder || 99) - (b.display?.featuredOrder || 99))
    .slice(0, 3);

  if (!flagship) return null;

  return (
    <section id="products" className="relative px-5 py-16 md:px-8 md:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-10 max-w-3xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9a9a]">Featured Products</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold text-white md:text-5xl">
            Products that look and operate like real software.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/56">
            Minecraft plugins, Discord systems, licensing, docs, downloads, and portals built as one product family.
          </p>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-[1.16fr_0.84fr]">
          <Reveal>
            <FlagshipProduct product={flagship} />
          </Reveal>
          <Stagger className="grid gap-4">
            {secondary.map((product) => (
              <StaggerItem key={product.slug}>
                <SecondaryProduct product={product} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

function FlagshipProduct({ product }: { product: HomeProduct }) {
  return (
    <article className="relative min-h-full overflow-hidden rounded-lg bg-white/[0.035] p-5 premium-depth md:p-7">
      <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#ff8a8a]/8 blur-3xl" />
      <div className="relative grid gap-7 lg:grid-cols-[0.88fr_1.05fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-white/[0.055] px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#ffd8d8]">
              Flagship
            </span>
            <StatusBadge tone={product.accent}>{product.status}</StatusBadge>
            <span className="rounded-md bg-black/20 px-2.5 py-1 font-mono text-xs text-white/44">
              v{product.version || "1.0.0"}
            </span>
          </div>

          <h3 className="mt-5 text-balance text-3xl font-semibold text-white md:text-5xl">{product.name}</h3>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/60">{product.fullDescription || product.description}</p>

          <div className="mt-6 grid gap-2">
            {sellingPoints(product).slice(0, 4).map((feature) => (
              <div key={feature} className="flex items-start gap-3 text-sm leading-6 text-white/62">
                <Check className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" style={{ color: product.accentColor || "#ff9a9a" }} />
                {feature}
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ProductButtons product={product} />
          </div>
        </div>

        <ProductIconPanel product={product} variant="featured" className="min-h-[420px]" />
      </div>
    </article>
  );
}

function SecondaryProduct({ product }: { product: HomeProduct }) {
  return (
    <article className="group overflow-hidden rounded-lg bg-white/[0.026] transition duration-300 hover:-translate-y-1 hover:bg-white/[0.045] hover:shadow-[0_22px_80px_rgba(0,0,0,0.22)]">
      <ProductIconPanel product={product} variant="compact" className="min-h-36 rounded-b-none" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#ff9a9a]">{product.category || "Product"}</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{product.name}</h3>
          </div>
          <StatusBadge tone={product.accent}>{product.display?.statusBadgeText || product.status}</StatusBadge>
        </div>
        <p className="mt-3 text-sm leading-6 text-white/54">{product.description}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="font-mono text-xs text-white/36">v{product.version || "0.1.0"}</span>
          <Link href={`/products/${product.slug}`} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-white/[0.045] px-3 text-sm font-semibold text-white/68 transition hover:text-white">
            Learn More
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function MxfFactionsHomeFeature({ product }: { product?: HomeProduct }) {
  const title = product ? `${product.name} is built for competitive servers.` : "MxF Factions is built for competitive servers.";
  const copy = product?.fullDescription || product?.description || "War tooling, operations workflows, outposts, seasons, and analytics presented through a product experience server owners can actually run.";
  const highlights = product ? sellingPoints(product).slice(0, 3) : [];

  return (
    <section className="px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.12fr] lg:items-center">
        <Reveal>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9a9a]">Flagship Platform</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold text-white md:text-5xl">
            {title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/58">
            {copy}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {product ? <ProductButtons product={product} /> : <ButtonLink href="/products/mxf-factions">View MxF Factions</ButtonLink>}
          </div>
        </Reveal>

        <Reveal delay={0.08} className="relative">
          {product ? <ProductIconPanel product={product} variant="hero" className="min-h-[500px]" /> : null}
          {highlights.length ? (
            <div className="absolute -bottom-6 left-5 right-5 hidden grid-cols-3 gap-3 rounded-lg bg-[#070a0f]/82 p-4 shadow-2xl backdrop-blur-xl md:grid">
            {highlights.map((area) => (
              <div key={area}>
                <ShieldCheck className="h-4 w-4 text-[#ffb0b0]" aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-white">{area}</p>
                <p className="mt-1 text-xs text-white/38">{product?.display?.layoutTemplate || "Product"}</p>
              </div>
            ))}
            </div>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}

function ProductButtons({ product }: { product: HomeProduct }) {
  const buttons = product.buttons?.length
    ? product.buttons
    : [
        { label: product.purchaseButtonText || "Learn More", href: `/products/${product.slug}`, style: "primary" as const },
        { label: "Docs", href: product.documentationLink || "/docs", style: "secondary" as const },
      ];

  return (
    <>
      {buttons.slice(0, 2).map((button) => (
        <ButtonLink key={`${button.label}-${button.href}`} href={button.href} variant={button.style}>
          {button.style !== "primary" && /doc/i.test(button.label) ? <BookOpen className="h-4 w-4" aria-hidden="true" /> : null}
          {button.label}
        </ButtonLink>
      ))}
    </>
  );
}

function sellingPoints(product: HomeProduct) {
  return product.highlightedFeatures?.length
    ? product.highlightedFeatures
    : product.features.length
      ? product.features
      : product.tags || [];
}

export function WhyMxfLabs() {
  const reasons = [
    ["Production-first engineering", "Designed for live communities, not one-off demos."],
    ["Integrated delivery", "Products, licenses, downloads, Discord roles, and support move together."],
    ["Built for server owners", "Configuration and docs are part of the product, not an afterthought."],
    ["Long-term maintainability", "Clean architecture, modular systems, and update-ready foundations."],
  ];

  return (
    <section className="px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-8 max-w-3xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9a9a]">Why MxF Labs</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold text-white md:text-5xl">
            Practical software discipline for communities that depend on their tools.
          </h2>
        </Reveal>
        <div className="border-y border-white/10">
          {reasons.map(([title, copy]) => (
            <article key={title} className="grid gap-3 border-b border-white/8 py-5 last:border-b-0 md:grid-cols-[16rem_1fr]">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm leading-6 text-white/54">{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DocsPreview() {
  const categories = ["Getting Started", "Product Setup", "Licensing", "Commands", "Troubleshooting", "API Reference"];

  return (
    <section className="px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <Reveal>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9a9a]">Documentation</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold text-white md:text-5xl">
            Docs that support setup, ownership, and long-term operation.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/56">
            Setup, configuration, permissions, commands, license activation, downloads, troubleshooting, and API references are organized for product owners.
          </p>
          <ButtonLink href="/docs" variant="secondary" className="mt-7">
            Open Docs
          </ButtonLink>
        </Reveal>

        <Reveal delay={0.08} className="relative pb-8">
          <DocsArtwork className="min-h-[360px]" />
          <div className="absolute bottom-0 left-5 right-5 grid gap-2 rounded-lg bg-[#070a0f]/84 p-3 shadow-2xl backdrop-blur-xl sm:grid-cols-3">
            {categories.map((category) => (
              <Link key={category} href={`/docs?q=${encodeURIComponent(category)}`} className="rounded-md bg-white/[0.045] px-3 py-2 text-xs font-semibold text-white/62 transition hover:text-white">
                {category}
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
