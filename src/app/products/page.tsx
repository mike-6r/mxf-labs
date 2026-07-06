import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowUpRight, Bot, Check, Code2, PackageCheck, Sparkles, Swords } from "lucide-react";
import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/animations/reveal";
import { ProductIconGlyph, ProductIconPanel } from "@/components/products/product-icon-artwork";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPublicProducts } from "@/lib/db/public";
import { publicPriceLabel } from "@/lib/pricing";
import { productProgressColor, productProgressValue, shouldShowProductProgress, type ProductProgressPlacement } from "@/lib/products/progress";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Premium MxF Labs commercial software products for Minecraft servers, Discord communities, and developer infrastructure.",
};

type PublicProduct = Awaited<ReturnType<typeof getPublicProducts>>[number];

export default async function ProductsPage() {
  const products = await getPublicProducts();
  const featuredProducts = products
    .filter((product) => product.display.featured && product.display.showFeaturedSection)
    .sort((a, b) => a.display.featuredOrder - b.display.featuredOrder);
  const featuredSlugs = new Set(featuredProducts.map((product) => product.slug));
  const minecraftProducts = products.filter((product) => matches(product, "minecraft") && !featuredSlugs.has(product.slug));
  const discordProducts = products.filter((product) => matches(product, "discord") && !featuredSlugs.has(product.slug));
  const infrastructureProducts = products.filter((product) => (matches(product, "infrastructure") || matches(product, "api")) && !featuredSlugs.has(product.slug));
  const groupedSlugs = new Set([...featuredSlugs, ...minecraftProducts.map((product) => product.slug), ...discordProducts.map((product) => product.slug), ...infrastructureProducts.map((product) => product.slug)]);
  const otherProducts = products.filter((product) => !groupedSlugs.has(product.slug));
  const customerProducts = products.filter((product) => !matches(product, "infrastructure") && !matches(product, "api"));

  return (
    <>
      <ProductsHero products={products} />
      <main className="px-5 pb-24 md:px-8 md:pb-32">
        <div className="mx-auto max-w-7xl">
          {products.length ? (
            <>
              <StorefrontNav
                hasFeatured={featuredProducts.length > 0}
                hasMinecraft={minecraftProducts.length > 0}
                hasDiscord={discordProducts.length > 0}
                hasInfrastructure={infrastructureProducts.length > 0}
                hasOther={otherProducts.length > 0}
              />
              {featuredProducts.length ? <FeaturedProducts products={featuredProducts} /> : null}
              <ProductFamilySection
                id="minecraft"
                eyebrow="Minecraft Products"
                title="Commercial server platforms, not resource listings."
                description="Each product renders from its own admin layout, media, feature, progress, CTA, and status configuration."
                products={minecraftProducts}
                icon={<Swords className="h-5 w-5 text-[#ffb0b0]" aria-hidden="true" />}
              />
              <ProductFamilySection
                id="discord"
                eyebrow="Discord Product"
                title="One modular Discord platform with product-level structure."
                description="MxF Discord software uses a different storefront treatment from Minecraft plugins because the admin layout template says so."
                products={discordProducts}
                icon={<Bot className="h-5 w-5 text-[#ffb0b0]" aria-hidden="true" />}
              />
              <InfrastructureSection products={infrastructureProducts} />
              <ProductFamilySection
                id="other"
                eyebrow="More Products"
                title="Admin-created products with their own storefront treatment."
                description="Products that do not belong to Minecraft, Discord, or infrastructure still render publicly when their admin record is visible."
                products={otherProducts}
                icon={<PackageCheck className="h-5 w-5 text-[#ffb0b0]" aria-hidden="true" />}
              />
              <BuyingConfidence products={customerProducts} infrastructureCount={infrastructureProducts.length} />
            </>
          ) : (
            <EmptyState
              icon={PackageCheck}
              title="No public products are published yet."
              description="Products appear here after launch records are created, marked visible, and allowed by the current content mode."
              action={{ label: "Open support", href: "/support" }}
            />
          )}
        </div>
      </main>
    </>
  );
}

function ProductsHero({ products }: { products: PublicProduct[] }) {
  const minecraftCount = products.filter((product) => matches(product, "minecraft")).length;
  const discordCount = products.filter((product) => matches(product, "discord")).length;
  const infrastructureCount = products.filter((product) => matches(product, "infrastructure") || matches(product, "api")).length;

  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-px w-[78vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/16 to-transparent" />
        <div className="absolute left-[9%] top-24 h-72 w-72 rounded-full bg-[#ff6262]/8 blur-3xl" />
        <div className="absolute right-[8%] top-44 h-80 w-80 rounded-full bg-[#7dd3fc]/7 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_0.78fr] lg:items-center">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffd8d8]">
            <Sparkles className="h-4 w-4 text-[#ff9a9a]" aria-hidden="true" />
            Product Storefront
          </p>
          <h1 className="mt-6 max-w-5xl text-balance text-[2.85rem] font-semibold leading-[0.96] text-white sm:text-6xl lg:text-[4.75rem]">
            Software products with their own shape.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/62 md:text-xl">
            Minecraft platforms, Discord systems, and internal APIs presented from admin-managed content, media, CTAs, layouts, and release state.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="#featured">View Featured</ButtonLink>
            <ButtonLink href="/support" variant="secondary">Contact Support</ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <StorefrontConsole products={products} counts={{ minecraftCount, discordCount, infrastructureCount }} />
        </Reveal>
      </div>
    </section>
  );
}

function StorefrontConsole({
  products,
  counts,
}: {
  products: PublicProduct[];
  counts: { minecraftCount: number; discordCount: number; infrastructureCount: number };
}) {
  const previewProducts = products.slice(0, 5);

  return (
    <div className="relative min-h-[31rem]">
      <div className="absolute inset-0 rounded-full bg-[#ff6262]/10 blur-3xl" />
      <div className="screen-sheen premium-depth relative overflow-hidden rounded-lg bg-[#070a0f] p-4">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:34px_34px]" />
        <div className="relative rounded-md border border-white/10 bg-black/34 p-4">
          <div className="flex items-center justify-between border-b border-white/8 pb-4">
            <div>
              <p className="text-sm font-semibold text-white">MxF Product OS</p>
              <p className="mt-1 text-xs text-white/40">Admin-controlled storefront records</p>
            </div>
            <span className="rounded-md bg-[#86efac]/10 px-2.5 py-1 text-xs font-semibold text-[#dfffe8]">Synced</span>
          </div>
          <div className="mt-5 grid gap-3">
            {previewProducts.map((product) => (
              <Link key={product.slug} href={`/products/${product.slug}`} className="group rounded-md border border-white/8 bg-white/[0.04] p-3 transition hover:border-[#ff6262]/30 hover:bg-white/[0.06]">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04]" style={{ color: product.accentColor }}>
                      <ProductIconGlyph name={product.icon} className="h-4 w-4" />
                    </span>
                    <span className="truncate text-sm font-semibold text-white group-hover:text-[#ffd8d8]">{product.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-white/40">{product.display.cardStyle}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/38">
                  <span>{product.display.statusBadgeText || product.status}</span>
                  <span>{publicPriceLabel(product.price, product.priceCents)}</span>
                </div>
                <ProgressBar product={product} placement="card" compact className="mt-3" />
              </Link>
            ))}
            {!previewProducts.length ? <p className="rounded-md border border-white/8 bg-white/[0.035] p-4 text-sm text-white/46">Publish product records to populate this surface.</p> : null}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-16 left-10 right-10 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 backdrop-blur-xl">
        {[
          ["Minecraft", counts.minecraftCount],
          ["Discord", counts.discordCount],
          ["Infrastructure", counts.infrastructureCount],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#05070a]/84 p-3 text-center">
            <p className="text-lg font-semibold text-white">{value}</p>
            <p className="mt-1 text-[11px] text-white/38">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StorefrontNav({
  hasFeatured,
  hasMinecraft,
  hasDiscord,
  hasInfrastructure,
  hasOther,
}: {
  hasFeatured: boolean;
  hasMinecraft: boolean;
  hasDiscord: boolean;
  hasInfrastructure: boolean;
  hasOther: boolean;
}) {
  const links = [
    ["Featured", "#featured", hasFeatured],
    ["Minecraft", "#minecraft", hasMinecraft],
    ["Discord", "#discord", hasDiscord],
    ["Infrastructure", "#infrastructure", hasInfrastructure],
    ["More", "#other", hasOther],
  ].filter((item) => item[2]);

  if (!links.length) return null;

  return (
    <Reveal className="sticky top-20 z-20 mb-14 hidden rounded-lg border border-white/10 bg-[#05070a]/72 p-2 backdrop-blur-xl lg:block">
      <nav className="grid gap-2" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }} aria-label="Product sections">
        {links.map(([label, href]) => (
          <a key={String(href)} href={String(href)} className="rounded-md px-4 py-3 text-center text-sm font-semibold text-white/52 transition hover:bg-white/[0.055] hover:text-white">
            {label}
          </a>
        ))}
      </nav>
    </Reveal>
  );
}

function FeaturedProducts({ products }: { products: PublicProduct[] }) {
  return (
    <section id="featured" className="scroll-mt-32">
      <div className="grid gap-8">
        {products.map((product, index) => (
          <FeaturedProduct key={product.slug} product={product} secondary={index > 0} />
        ))}
      </div>
    </section>
  );
}

function FeaturedProduct({ product, secondary = false }: { product: PublicProduct; secondary?: boolean }) {
  const points = sellingPoints(product).slice(0, secondary ? 3 : 5);

  return (
    <Reveal className={cn("grid gap-10 rounded-lg bg-white/[0.035] p-5 premium-depth md:p-8 lg:items-center", secondary ? "lg:grid-cols-[0.9fr_0.8fr]" : "lg:grid-cols-[0.72fr_1.08fr]")}>
      <div>
        <ProductMeta product={product} featured />
        <h2 className={cn("mt-6 max-w-3xl text-balance font-semibold leading-[1.02] text-white", secondary ? "text-3xl md:text-5xl" : "text-4xl md:text-6xl")}>
          {product.name}
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/62">{product.fullDescription || product.description}</p>
        {points.length ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {points.map((point) => (
              <FeatureLine key={point} accentColor={product.accentColor}>{point}</FeatureLine>
            ))}
          </div>
        ) : null}
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <ProductActions product={product} />
        </div>
      </div>

      <div className="relative">
        <div className="absolute -inset-8 rounded-full opacity-20 blur-3xl" style={{ background: product.accentColor }} />
        <ProductIconPanel product={product} variant="featured" className={secondary ? "min-h-[24rem]" : "min-h-[34rem]"} />
      </div>
    </Reveal>
  );
}

function ProductFamilySection({
  id,
  eyebrow,
  title,
  description,
  products,
  icon,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  products: PublicProduct[];
  icon: ReactNode;
}) {
  if (!products.length) return null;

  return (
    <section id={id} className="scroll-mt-32 pt-24 md:pt-32">
      <Reveal>
        <SectionIntro eyebrow={eyebrow} title={title} description={description} icon={icon} />
      </Reveal>
      <div className="mt-12 grid gap-8">
        {products.map((product, index) => (
          <Reveal key={product.slug} id={product.slug} delay={index * 0.06} className="scroll-mt-32">
            <ProductCard product={product} reverse={index % 2 === 1} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product, reverse = false }: { product: PublicProduct; reverse?: boolean }) {
  if (product.display.layoutTemplate === "flagship") return <FlagshipCard product={product} reverse={reverse} />;
  if (product.display.layoutTemplate === "coming-soon") return <ComingSoonCard product={product} reverse={reverse} />;
  if (product.display.layoutTemplate === "free") return <FreeProductCard product={product} />;
  if (product.display.layoutTemplate === "infrastructure-api") return <InfrastructureCard product={product} />;
  return <CompactProductCard product={product} />;
}

function FlagshipCard({ product, reverse = false }: { product: PublicProduct; reverse?: boolean }) {
  return (
    <article className={cn("grid gap-8 border-t border-white/10 py-12 lg:grid-cols-[1fr_0.9fr] lg:items-center", reverse && "lg:grid-cols-[0.9fr_1fr]")}>
      <div className={cn(reverse && "lg:order-2")}>
        <ProductMeta product={product} />
        <h3 className="mt-5 text-balance text-3xl font-semibold text-white md:text-5xl">{product.name}</h3>
        <p className="mt-4 max-w-3xl text-base leading-8 text-white/60">{product.fullDescription || product.description}</p>
        <ProgressBar product={product} placement="card" className="mt-7" />
        <FeatureCloud features={sellingPoints(product)} limit={10} className="mt-8" />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ProductActions product={product} />
        </div>
      </div>
      <ProductIconPanel product={product} variant="featured" className="min-h-[26rem]" />
    </article>
  );
}

function ComingSoonCard({ product, reverse = false }: { product: PublicProduct; reverse?: boolean }) {
  const roadmap = product.roadmap.slice(0, 4);

  return (
    <article className={cn("grid gap-8 border-t border-white/10 py-12 lg:grid-cols-[0.88fr_1fr] lg:items-start", reverse && "lg:grid-cols-[1fr_0.88fr]")}>
      <ProductIconPanel product={product} variant="card" className={cn("min-h-[21rem]", reverse && "lg:order-2")} />
      <div>
        <ProductMeta product={product} />
        <h3 className="mt-5 text-balance text-3xl font-semibold text-white md:text-5xl">{product.name}</h3>
        <p className="mt-4 max-w-3xl text-base leading-8 text-white/60">{product.fullDescription || product.description}</p>
        <ProgressBar product={product} placement="card" className="mt-7" />
        {roadmap.length ? (
          <div className="mt-8 grid gap-3">
            {roadmap.map((item, index) => (
              <div key={item} className="grid grid-cols-[auto_1fr] gap-3 border-t border-white/10 pt-4">
                <span className="font-mono text-xs text-white/32">0{index + 1}</span>
                <p className="text-sm leading-6 text-white/58">{item}</p>
              </div>
            ))}
          </div>
        ) : null}
        <FeatureCloud features={product.tags} limit={8} className="mt-8" />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ProductActions product={product} />
        </div>
      </div>
    </article>
  );
}

function FreeProductCard({ product }: { product: PublicProduct }) {
  return (
    <article className="grid gap-8 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-[#ff6262]/28 hover:bg-white/[0.045] md:p-7 lg:grid-cols-[0.82fr_1fr] lg:items-center">
      <ProductIconPanel product={product} variant="card" className="min-h-[20rem]" />
      <div>
        <ProductMeta product={product} />
        <h3 className="mt-5 text-3xl font-semibold text-white md:text-5xl">{product.name}</h3>
        <p className="mt-4 text-base leading-8 text-white/60">{product.description}</p>
        <ProgressBar product={product} placement="card" className="mt-7" />
        <FeatureCloud features={sellingPoints(product)} limit={12} className="mt-7" />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ProductActions product={product} />
        </div>
      </div>
    </article>
  );
}

function CompactProductCard({ product }: { product: PublicProduct }) {
  return (
    <article className="group grid overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-[#ff6262]/28 hover:bg-white/[0.045] md:grid-cols-[0.72fr_1fr]">
      <ProductIconPanel product={product} variant="compact" className="min-h-64 rounded-none" />
      <div className="p-6 md:p-8">
        <ProductMeta product={product} />
        <h3 className="mt-5 text-3xl font-semibold text-white">{product.name}</h3>
        <p className="mt-3 text-sm leading-6 text-white/56">{product.description}</p>
        <ProgressBar product={product} placement="card" compact className="mt-5" />
        <FeatureCloud features={sellingPoints(product)} limit={7} className="mt-6" />
        <Link href={`/products/${product.slug}`} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/68 transition hover:text-white">
          View Product
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function InfrastructureSection({ products }: { products: PublicProduct[] }) {
  if (!products.length) return null;

  return (
    <section id="infrastructure" className="scroll-mt-32 py-20 md:py-28">
      <Reveal>
        <SectionIntro
          eyebrow="Infrastructure"
          title="Internal systems powering the MxF ecosystem."
          description="These records are not positioned as customer plugins. They describe backend services for products, owners, and future developer integrations."
          icon={<Code2 className="h-5 w-5 text-[#ffb0b0]" aria-hidden="true" />}
        />
      </Reveal>
      <Stagger className="mt-12 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <StaggerItem key={product.slug}>
            <InfrastructureCard product={product} embedded />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

function InfrastructureCard({ product, embedded = false }: { product: PublicProduct; embedded?: boolean }) {
  return (
    <article className={cn("group bg-[#05070a]/86 p-6 transition hover:bg-[#0a1016]/92", !embedded && "rounded-lg border border-white/10")}>
      <ProductIconGlyph name={product.icon || "Code2"} className="h-5 w-5 text-[#ffb0b0]" />
      <div className="mt-5 flex items-start justify-between gap-4">
        <h3 className="text-xl font-semibold text-white">{product.name}</h3>
        <StatusBadge tone={product.accent}>{product.display.statusBadgeText || product.status}</StatusBadge>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/52">{product.description}</p>
      <FeatureCloud features={sellingPoints(product)} limit={4} className="mt-5" />
      <Link href={`/products/${product.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#ffd8d8] transition hover:text-white">
        View system
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

function BuyingConfidence({ products, infrastructureCount }: { products: PublicProduct[]; infrastructureCount: number }) {
  const proofPoints = [
    [String(products.length), "Customer products"],
    [String(infrastructureCount), "Infrastructure systems"],
    [priceRange(products), "Launch pricing"],
    ["Admin", "Presentation control"],
  ];

  return (
    <Reveal>
      <section className="relative overflow-hidden rounded-lg bg-[#080b10] p-6 premium-depth md:p-10">
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#ff6262]/14 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffb0b0]">Commercial standard</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold text-white md:text-5xl">
              Products stay editable after launch.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58">
              Pricing, support, documentation, licensing, downloads, media, CTAs, badges, progress, SEO, and layout decisions come from the product record.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2">
            {proofPoints.map(([value, label]) => (
              <div key={label} className="bg-[#05070a]/82 p-5">
                <p className="text-3xl font-semibold text-white">{value}</p>
                <p className="mt-2 text-sm text-white/46">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function ProductMeta({ product, featured = false }: { product: PublicProduct; featured?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {featured ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#ffd8d8]">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {product.display.badgeText || "Featured"}
        </span>
      ) : product.display.badgeText ? (
        <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs font-semibold text-white/52">{product.display.badgeText}</span>
      ) : null}
      <StatusBadge tone={product.accent}>{product.display.statusBadgeText || product.status}</StatusBadge>
      <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs font-semibold text-white/52">
        {publicPriceLabel(product.price, product.priceCents)}
      </span>
      <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1 text-xs text-white/42">v{product.version || "0.1.0"}</span>
      <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1 text-xs text-white/42">{product.category || "Product"}</span>
    </div>
  );
}

function ProgressBar({
  product,
  className,
  compact = false,
  placement,
}: {
  product: PublicProduct;
  className?: string;
  compact?: boolean;
  placement: ProductProgressPlacement;
}) {
  if (!shouldShowProductProgress(product, placement)) return null;

  const value = productProgressValue(product);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-4">
        <p className={cn("font-semibold text-white", compact ? "text-xs" : "text-sm")}>{product.display.progressLabel || "Progress"}</p>
        <span className="font-mono text-xs text-white/42">{value}%</span>
      </div>
      <div className={cn("mt-3 overflow-hidden rounded-full bg-white/8", compact ? "h-1.5" : "h-2")}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: productProgressColor(product) }} />
      </div>
    </div>
  );
}

function ProductActions({ product }: { product: PublicProduct }) {
  const buttons = product.buttons.length
    ? product.buttons
    : [{ label: product.purchaseButtonText || "View Product", href: `/products/${product.slug}`, style: "primary" as const }];

  return (
    <>
      {buttons.slice(0, 3).map((button) => (
        <ButtonLink key={`${button.label}-${button.href}`} href={button.href || `/products/${product.slug}`} variant={button.style}>
          {button.label}
        </ButtonLink>
      ))}
    </>
  );
}

function FeatureLine({ children, accentColor }: { children: ReactNode; accentColor: string }) {
  return (
    <div className="flex items-start gap-3 border-t border-white/10 pt-4 text-sm leading-6 text-white/62">
      <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" style={{ color: accentColor }} />
      {children}
    </div>
  );
}

function FeatureCloud({ features, limit, className }: { features: string[]; limit: number; className?: string }) {
  if (!features.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {features.slice(0, limit).map((feature) => (
        <span key={feature} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-white/58">
          {feature}
        </span>
      ))}
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="max-w-[760px]">
      <div className="flex items-center gap-3">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffb0b0]">{eyebrow}</p>
      </div>
      <h2 className="mt-4 text-balance text-3xl font-semibold text-white md:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-8 text-white/58">{description}</p>
    </div>
  );
}

function matches(product: PublicProduct, value: string) {
  return `${product.category} ${product.name} ${product.slug}`.toLowerCase().includes(value.toLowerCase());
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

function priceRange(products: PublicProduct[]) {
  const prices = products
    .map((product) => product.priceCents)
    .filter((value) => value > 0)
    .sort((a, b) => a - b);

  if (!prices.length) return "Free";
  const min = prices[0] / 100;
  const max = prices[prices.length - 1] / 100;
  return min === max ? `$${min}` : `$${min}-$${max}`;
}
