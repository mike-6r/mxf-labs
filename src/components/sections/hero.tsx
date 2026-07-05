"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { ProductIconGlyph, ProductIconPanel } from "@/components/products/product-icon-artwork";
import { ButtonLink } from "@/components/ui/button-link";
import { StatusBadge } from "@/components/ui/status-badge";

type HeroProduct = {
  slug: string;
  name: string;
  description: string;
  category?: string;
  status: string;
  version?: string;
  icon?: string;
  featureIcons?: string[];
  tags?: string[];
  accentColor?: string;
  media?: {
    cardImage?: string;
    heroImage?: string;
    featuredImage?: string;
  };
  display?: {
    layoutTemplate?: string;
    badgeText?: string;
    statusBadgeText?: string;
    cardStyle?: string;
    heroStyle?: string;
    showProgress?: boolean;
    progressLabel?: string;
    progressValue?: number;
  };
};

const preferredProductOrder = ["mxf-factions", "mxf-prisons", "mxf-skyblock", "mxf-aio-bot"];

const trustPoints = [
  "Java 8-21 ready",
  "Modular YAML configuration",
  "Secure license validation",
  "Discord + portal sync",
  "Production-focused architecture",
];

export function Hero({
  settings = {},
  products = [],
}: {
  settings?: Record<string, string>;
  products?: HeroProduct[];
}) {
  const reduceMotion = useReducedMotion();
  const heroProducts = productPreviewList(products);

  return (
    <section className="relative overflow-hidden px-5 py-14 md:px-8 md:py-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-px w-[76vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
        <div className="absolute left-[8%] top-20 h-64 w-64 rounded-full bg-[#ff8a8a]/5 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.12fr_0.88fr]">
        <div>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.38 }}
            className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#ffd8d8]"
          >
            <Sparkles className="h-4 w-4 text-[#ff8a8a]" aria-hidden="true" />
            {settings["home.hero_badge"] || "MxF Labs"}
          </motion.p>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.04 }}
            className="max-w-4xl text-balance text-[2.25rem] font-semibold leading-[1.04] text-white sm:text-5xl lg:text-[3.1rem] xl:text-[3.25rem]"
          >
            {settings["home.hero_headline"] || "Software infrastructure for Minecraft servers and Discord communities."}
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 max-w-2xl text-base leading-8 text-white/62 md:text-lg"
          >
            {settings["home.hero_subheadline"] || "MxF Labs builds premium plugins, Discord automation, licensing, customer portals, documentation, and support systems designed for serious communities."}
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-row"
          >
            <ButtonLink href={settings["home.primary_cta_link"] || "/products"}>
              {settings["home.primary_cta_text"] || "Explore Products"}
            </ButtonLink>
            <ButtonLink href={settings["home.secondary_cta_link"] || "/docs"} variant="secondary">
              {settings["home.secondary_cta_text"] || "View Docs"}
            </ButtonLink>
          </motion.div>

          <TrustStrip />
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.58, delay: 0.12 }}
        >
          <ProductEcosystemPanel products={heroProducts} />
        </motion.div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <div className="mt-7 flex flex-wrap gap-2">
      {trustPoints.map((point, index) => (
        <span key={point} className={`${index > 2 ? "hidden sm:inline-flex" : "inline-flex"} items-center gap-2 rounded-md border border-white/8 bg-white/[0.025] px-3 py-2 text-xs font-medium text-white/56`}>
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#ff9a9a]" aria-hidden="true" />
          {point}
        </span>
      ))}
    </div>
  );
}

function ProductEcosystemPanel({ products }: { products: HeroProduct[] }) {
  const flagship = products.find((product) => product.slug === "mxf-factions") || products[0];
  const supporting = products.filter((product) => product.slug !== flagship?.slug).slice(0, 3);

  return (
    <div className="relative rounded-lg bg-[#0b0e13]/70 p-4 premium-depth backdrop-blur-xl md:p-5">
      <div className="absolute -right-16 top-10 h-56 w-56 rounded-full bg-[#7dd3fc]/7 blur-3xl" />
      <div className="relative flex items-center justify-between gap-4 pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#ff9a9a]">Product Suite</p>
          <h2 className="mt-2 text-lg font-semibold text-white md:text-xl">Plugins, Discord systems, licenses, and support in one flow.</h2>
        </div>
        <Link
          href="/products"
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/[0.055] text-white/56 transition hover:text-white sm:inline-flex"
          aria-label="View products"
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {flagship ? <ProductIconPanel product={flagship} variant="featured" className="min-h-64" /> : null}

      <div className="relative mt-4 grid gap-2">
        {supporting.map((product) => (
          <ProductRow key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}

function ProductRow({ product }: { product: HeroProduct }) {
  return (
    <Link href={`/products/${product.slug}`} className="group flex items-center justify-between gap-3 rounded-md bg-white/[0.026] px-3 py-3 transition hover:bg-white/[0.045]">
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04]" style={{ color: product.accentColor || "#ff6262" }}>
          <ProductIconGlyph name={product.icon} className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white group-hover:text-[#ffd8d8]">{product.name}</span>
            <StatusBadge tone={statusTone(product.status)}>{product.display?.statusBadgeText || product.status}</StatusBadge>
          </span>
          <span className="mt-1 block text-sm text-white/46">{product.category || "Product"}</span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-3 text-xs text-white/36">
        <span className="hidden rounded-md border border-white/8 bg-white/[0.03] px-2 py-1 font-mono sm:inline-flex">{product.display?.layoutTemplate || `v${product.version || "0.1.0"}`}</span>
        <ArrowUpRight className="h-4 w-4 transition group-hover:text-white" aria-hidden="true" />
      </span>
    </Link>
  );
}

function productPreviewList(products: HeroProduct[]) {
  const map = new Map(products.map((product) => [product.slug, product]));
  const preferred = preferredProductOrder.map((slug) => map.get(slug)).filter(Boolean) as HeroProduct[];
  const rest = products.filter((product) => !preferredProductOrder.includes(product.slug));
  return [...preferred, ...rest].slice(0, 4);
}

function statusTone(status: string) {
  if (/private|hidden|retired/i.test(status)) return "rose";
  if (/coming soon|progress|building|beta/i.test(status)) return "amber";
  if (/active|published|public|live|available/i.test(status)) return "lime";
  return "neutral";
}
