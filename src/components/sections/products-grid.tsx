import { ArrowUpRight, BookOpen, Check, PackageCheck } from "lucide-react";
import Link from "next/link";
import { Stagger, StaggerItem } from "@/components/animations/reveal";
import { ProductIconPanel } from "@/components/products/product-icon-artwork";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Product } from "@/lib/content";
import { publicPriceLabel } from "@/lib/pricing";
import { productProgressColor, productProgressValue, shouldShowProductProgress } from "@/lib/products/progress";

export function ProductsGrid({
  compact = false,
  initialProducts,
}: {
  compact?: boolean;
  initialProducts?: Product[];
}) {
  const sourceProducts = initialProducts || [];
  const visibleProducts = compact ? sourceProducts.slice(0, 3) : sourceProducts;

  return (
    <section id="products" className="px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Products"
            title="A product shelf for serious server owners and operators."
            description="Commercial-grade plugins, Discord systems, licensing infrastructure, and web tools with docs, support, versions, ownership, and release paths designed in from the start."
          />
          {compact ? (
            <ButtonLink href="/products" variant="secondary" className="w-fit">
              View Products
            </ButtonLink>
          ) : null}
        </div>

        <Stagger className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => (
            <StaggerItem key={product.name} id={product.slug}>
              <ProductShowcaseCard product={product} />
            </StaggerItem>
          ))}
        </Stagger>
        {!visibleProducts.length ? (
          <div className="mt-10">
            <EmptyState
              icon={PackageCheck}
              title="No public products are published yet."
              description="Product cards appear here after admin-managed records are made visible for the current content mode."
              action={{ label: "Open support", href: "/support" }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ProductShowcaseCard({ product }: { product: Product }) {
  const price = publicPriceLabel(product.price, product.priceCents || 0);
  const features = sellingPoints(product);

  return (
    <article className="animated-border group relative h-full rounded-lg">
      <div className="surface scanline flex h-full flex-col overflow-hidden rounded-lg transition duration-300 group-hover:-translate-y-1 group-hover:border-white/18">
        <ProductIconPanel product={product} variant="compact" className="h-52 rounded-b-none border-x-0 border-t-0 shadow-none" />

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff8a8a]">
                {product.category || "Product"}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">{product.name}</h3>
            </div>
            <StatusBadge tone={product.accent}>{product.display?.statusBadgeText || product.status}</StatusBadge>
          </div>

          <p className="mt-4 text-sm leading-6 text-white/58">{product.description}</p>

          <ProgressBar product={product} className="mt-5" />

          {features.length ? (
            <ul className="mt-5 grid gap-3">
            {features.slice(0, 3).map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-white/66">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" style={{ color: product.accentColor || "#ff6262" }} />
                {feature}
              </li>
            ))}
            </ul>
          ) : null}

          {product.tags?.length ? <FeatureTags tags={product.tags} /> : null}

          <div className="mt-auto pt-6">
            <div className="mb-4 flex items-center justify-between gap-4 rounded-md border border-white/8 bg-black/24 p-3">
              <span className="text-xs text-white/40">Pricing</span>
              <span className="text-right font-mono text-sm font-semibold text-white">{price}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <ButtonLink href={`/products/${product.slug}`} variant="secondary" className="w-full">
                View Details
              </ButtonLink>
              <Link
                href={product.documentationLink || "/docs"}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 text-sm font-semibold text-white/58 transition hover:border-[#ff6262]/35 hover:text-white"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Docs
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProgressBar({ product, className }: { product: Product; className?: string }) {
  if (!shouldShowProductProgress(product, "card")) return null;

  const value = productProgressValue(product);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold text-white/60">{product.display?.progressLabel || "Progress"}</p>
        <span className="font-mono text-xs text-white/40">{value}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: productProgressColor(product) }} />
      </div>
    </div>
  );
}

function FeatureTags({ tags }: { tags: string[] }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {tags.slice(0, 5).map((item) => (
        <span key={item} className="rounded-md border border-white/10 bg-white/[0.035] px-2.5 py-1 text-xs text-white/54">
          {item}
        </span>
      ))}
    </div>
  );
}

function sellingPoints(product: Product) {
  return product.highlightedFeatures?.length
    ? product.highlightedFeatures
    : product.features.length
      ? product.features
      : product.stack?.length
        ? product.stack
        : product.tags || [];
}
