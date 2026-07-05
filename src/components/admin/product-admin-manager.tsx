"use client";

import { Check, Eye, Save, Send, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductIconGlyph } from "@/components/products/product-icon-artwork";
import { isLiveProductStatus, isPrelaunchProductStatus, PRODUCT_STATUS_OPTIONS } from "@/lib/products/status";
import { cn } from "@/lib/utils";

type ProductMedia = {
  cardImage?: string;
  heroImage?: string;
  mockupImage?: string;
  featuredImage?: string;
  galleryImages?: string[];
  galleryCaptions?: string[];
  showcaseImages?: string[];
  showcaseCaptions?: string[];
};

type ProductDiscordConfig = {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  description?: string;
  bannerImage?: string;
  artworkImage?: string;
  thumbnailImage?: string;
  accentColor?: string;
  channelKey?: string;
  visibility?: "public" | "customers" | "staff" | "hidden";
  roleRequirement?: string;
  features?: string[];
  buttons?: ProductButton[];
};

type ProductDisplay = {
  layoutTemplate?: string;
  featured?: boolean;
  featuredOrder?: number;
  showFeaturedSection?: boolean;
  featuredLayoutStyle?: string;
  cardStyle?: string;
  heroStyle?: string;
  accentColor?: string;
  badgeText?: string;
  statusBadgeText?: string;
  showProgress?: boolean;
  progressLabel?: string;
  progressValue?: number;
  progressColor?: string;
  progressPlacement?: string;
  showMockup?: boolean;
  detailTabs?: string[];
  detailSectionOrder?: string[];
  detailHiddenSections?: string[];
  detailSectionTitles?: Record<string, string>;
  featureCategories?: ProductFeatureCategory[];
  featurePaginationLimit?: number;
  discord?: ProductDiscordConfig;
};

type ProductFeatureCategory = {
  title: string;
  items: string[];
};

type ProductButton = {
  label: string;
  href: string;
  style: "primary" | "secondary" | "ghost";
};

type ProductSeo = {
  title?: string;
  description?: string;
  image?: string;
};

type MediaSlot = "cardImage" | "heroImage" | "mockupImage" | "featuredImage" | "galleryImages" | "showcaseImages";

type ProductItem = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  featuresJson: string;
  highlightedFeaturesJson: string;
  tagsJson: string;
  featureIconsJson: string;
  techStackJson: string;
  faqJson: string;
  roadmapJson: string;
  screenshotsJson: string;
  licenseRulesJson: string;
  mediaJson: string;
  displayJson: string;
  buttonsJson: string;
  seoJson: string;
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
  _count?: {
    downloads: number;
    documentation: number;
    releases: number;
  };
};

type Values = {
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  status: string;
  visible: boolean;
  price: string;
  priceCents: string;
  currency: string;
  purchaseButtonText: string;
  defaultActivationLimit: string;
  fullDescription: string;
  features: string;
  highlightedFeatures: string;
  tags: string;
  featureIcons: string;
  faq: string;
  roadmap: string;
  changelog: string;
  techStack: string;
  screenshots: string;
  licenseRules: string;
  documentationLink: string;
  supportLink: string;
  version: string;
  icon: string;
  cardImage: string;
  heroImage: string;
  mockupImage: string;
  featuredImage: string;
  galleryImages: string;
  galleryCaptions: string;
  showcaseImages: string;
  showcaseCaptions: string;
  layoutTemplate: string;
  featured: boolean;
  featuredOrder: string;
  showFeaturedSection: boolean;
  featuredLayoutStyle: string;
  cardStyle: string;
  heroStyle: string;
  accentColor: string;
  badgeText: string;
  statusBadgeText: string;
  showProgress: boolean;
  progressLabel: string;
  progressValue: string;
  progressColor: string;
  progressPlacement: string;
  showMockup: boolean;
  detailTabs: string;
  detailSectionOrder: string;
  detailHiddenSections: string;
  detailSectionTitles: string;
  featureCategories: string;
  featurePaginationLimit: string;
  discordEnabled: boolean;
  discordTitle: string;
  discordSubtitle: string;
  discordDescription: string;
  discordBannerImage: string;
  discordArtworkImage: string;
  discordThumbnailImage: string;
  discordAccentColor: string;
  discordChannelKey: string;
  discordVisibility: string;
  discordRoleRequirement: string;
  discordFeatures: string;
  discordButtonsText: string;
  buttonsText: string;
  seoTitle: string;
  seoDescription: string;
  seoImage: string;
};

const tabs = ["Basics", "Pricing", "Features", "Media", "Layout", "Detail UX", "Discord", "Buttons", "Roadmap", "Docs", "License Rules", "SEO"];
const statuses = [...PRODUCT_STATUS_OPTIONS];
const currencies = ["USD", "EUR", "GBP", "CAD", "AUD"];
const layoutTemplates = ["flagship", "compact", "coming-soon", "free", "infrastructure-api"];
const featuredLayoutStyles = ["cinematic", "split", "editorial", "compact"];
const cardStyles = ["orbital", "minimal", "terminal", "stacked"];
const heroStyles = ["constellation", "minimal", "terminal", "stacked", "image"];
const progressPlacements = ["card", "hero", "detail", "hidden"];
const buttonStyles = ["primary", "secondary", "ghost"];
const discordVisibilities = ["public", "customers", "staff", "hidden"];
const defaultDetailTabs = ["overview", "features", "showcase", "documentation", "licensing", "roadmap", "faq", "changelog"];
const defaultDetailSectionOrder = ["overview", "features", "showcase", "documentation", "licensing", "roadmap", "faq"];

function parseJsonObject<T extends object>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? { ...fallback, ...parsed } : fallback;
  } catch {
    return fallback;
  }
}

function parseJsonArray(value: string | undefined) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function jsonListToText(value: string | undefined) {
  return parseJsonArray(value).join("\n");
}

function arrayToText(value: unknown, fallback: string[] = []) {
  return (Array.isArray(value) ? value : fallback).map(String).filter(Boolean).join("\n");
}

function splitList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function recordToText(value: Record<string, string> | undefined) {
  return Object.entries(value || {})
    .map(([key, item]) => `${key}|${item}`)
    .join("\n");
}

function textToRecord(value: string) {
  return Object.fromEntries(
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key = "", item = ""] = line.split("|").map((part) => part.trim());
        return [key, item];
      })
      .filter(([key, item]) => key && item),
  );
}

function categoriesToText(categories: ProductFeatureCategory[] | undefined) {
  return (categories || [])
    .flatMap((category) => category.items.map((item) => `${category.title}|${item}`))
    .join("\n");
}

function textToFeatureCategories(value: string): ProductFeatureCategory[] {
  const categoryMap = new Map<string, string[]>();

  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [category = "", item = ""] = line.split("|").map((part) => part.trim());
      if (!category || !item) return;
      categoryMap.set(category, [...(categoryMap.get(category) || []), item]);
    });

  return Array.from(categoryMap.entries()).map(([title, items]) => ({ title, items }));
}

function defaultLayoutFor(product?: Pick<ProductItem, "slug" | "category" | "price" | "status">) {
  const source = `${product?.slug || ""} ${product?.category || ""} ${product?.price || ""} ${product?.status || ""}`.toLowerCase();

  if (source.includes("infrastructure") || source.includes("api")) return "infrastructure-api";
  if (source.includes("free") || source.includes("discord")) return "free";
  if (source.includes("planned") || source.includes("coming soon")) return "coming-soon";
  if (source.includes("mxf-factions")) return "flagship";
  return "compact";
}

function buttonsToText(value: string | undefined) {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) return "";

    return parsed
      .map((button) => [button?.label, button?.href, button?.style || "secondary"].map((item) => String(item || "").trim()).join("|"))
      .filter((line) => !line.startsWith("||"))
      .join("\n");
  } catch {
    return "";
  }
}

function textToButtons(value: string): ProductButton[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label = "", href = "", style = "secondary"] = line.split("|").map((item) => item.trim());
      return {
        label,
        href,
        style: buttonStyles.includes(style) ? (style as ProductButton["style"]) : "secondary",
      };
    })
    .filter((button) => button.label && button.href);
}

function valuesFromProduct(product?: ProductItem): Values {
  const media = parseJsonObject<ProductMedia>(product?.mediaJson, {
    cardImage: "",
    heroImage: "",
    mockupImage: "",
    featuredImage: "",
    galleryImages: [],
    galleryCaptions: [],
    showcaseImages: [],
    showcaseCaptions: [],
  });
  const display = parseJsonObject<ProductDisplay>(product?.displayJson, {
    layoutTemplate: defaultLayoutFor(product),
    featured: product?.slug === "mxf-factions",
    featuredOrder: product?.slug === "mxf-factions" ? 1 : 50,
    showFeaturedSection: true,
    featuredLayoutStyle: "cinematic",
    cardStyle: "orbital",
    heroStyle: "constellation",
    accentColor: "#ff6262",
    badgeText: "",
    statusBadgeText: "",
    showProgress: false,
    progressLabel: "",
    progressValue: 0,
    progressColor: "",
    progressPlacement: "card",
    showMockup: false,
    detailTabs: defaultDetailTabs,
    detailSectionOrder: defaultDetailSectionOrder,
    detailHiddenSections: [],
    detailSectionTitles: {},
    featureCategories: [],
    featurePaginationLimit: 8,
    discord: {
      enabled: true,
      title: "",
      subtitle: "",
      description: "",
      bannerImage: "",
      artworkImage: "",
      thumbnailImage: "",
      accentColor: "",
      channelKey: "",
      visibility: "public",
      roleRequirement: "",
      features: [],
      buttons: [],
    },
  });
  const discord = display.discord || {};
  const seo = parseJsonObject<ProductSeo>(product?.seoJson, { title: "", description: "", image: "" });

  return {
    name: product?.name || "",
    slug: product?.slug || "",
    category: product?.category || "Product",
    shortDescription: product?.shortDescription || "",
    status: product?.status || "Coming Soon",
    visible: product?.visible ?? false,
    price: product?.price || "Contact for pricing",
    priceCents: String(product?.priceCents ?? 0),
    currency: product?.currency || "USD",
    purchaseButtonText: product?.purchaseButtonText || "Learn More",
    defaultActivationLimit: String(product?.defaultActivationLimit ?? 3),
    fullDescription: product?.fullDescription || "",
    features: jsonListToText(product?.featuresJson),
    highlightedFeatures: jsonListToText(product?.highlightedFeaturesJson),
    tags: jsonListToText(product?.tagsJson),
    featureIcons: jsonListToText(product?.featureIconsJson),
    faq: jsonListToText(product?.faqJson),
    roadmap: jsonListToText(product?.roadmapJson),
    changelog: jsonListToText(product?.changelogJson),
    techStack: jsonListToText(product?.techStackJson),
    screenshots: jsonListToText(product?.screenshotsJson),
    licenseRules: jsonListToText(product?.licenseRulesJson),
    documentationLink: product?.documentationLink || "",
    supportLink: product?.supportLink || "",
    version: product?.version || "0.1.0",
    icon: product?.icon || "PackageCheck",
    cardImage: media.cardImage || "",
    heroImage: media.heroImage || "",
    mockupImage: media.mockupImage || "",
    featuredImage: media.featuredImage || "",
    galleryImages: Array.isArray(media.galleryImages) ? media.galleryImages.join("\n") : "",
    galleryCaptions: Array.isArray(media.galleryCaptions) ? media.galleryCaptions.join("\n") : "",
    showcaseImages: Array.isArray(media.showcaseImages) ? media.showcaseImages.join("\n") : "",
    showcaseCaptions: Array.isArray(media.showcaseCaptions) ? media.showcaseCaptions.join("\n") : "",
    layoutTemplate: display.layoutTemplate || defaultLayoutFor(product),
    featured: Boolean(display.featured),
    featuredOrder: String(display.featuredOrder ?? 50),
    showFeaturedSection: display.showFeaturedSection !== false,
    featuredLayoutStyle: display.featuredLayoutStyle || "cinematic",
    cardStyle: display.cardStyle || "orbital",
    heroStyle: display.heroStyle || "constellation",
    accentColor: display.accentColor || "#ff6262",
    badgeText: display.badgeText || "",
    statusBadgeText: display.statusBadgeText || "",
    showProgress: Boolean(display.showProgress),
    progressLabel: display.progressLabel || "",
    progressValue: String(display.progressValue ?? 0),
    progressColor: display.progressColor || "",
    progressPlacement: progressPlacements.includes(display.progressPlacement || "") ? display.progressPlacement || "card" : "card",
    showMockup: Boolean(display.showMockup),
    detailTabs: arrayToText(display.detailTabs, defaultDetailTabs),
    detailSectionOrder: arrayToText(display.detailSectionOrder, defaultDetailSectionOrder),
    detailHiddenSections: arrayToText(display.detailHiddenSections),
    detailSectionTitles: recordToText(display.detailSectionTitles),
    featureCategories: categoriesToText(display.featureCategories),
    featurePaginationLimit: String(display.featurePaginationLimit ?? 8),
    discordEnabled: discord.enabled !== false,
    discordTitle: discord.title || "",
    discordSubtitle: discord.subtitle || "",
    discordDescription: discord.description || "",
    discordBannerImage: discord.bannerImage || "",
    discordArtworkImage: discord.artworkImage || "",
    discordThumbnailImage: discord.thumbnailImage || "",
    discordAccentColor: discord.accentColor || display.accentColor || "#ff6262",
    discordChannelKey: discord.channelKey || "",
    discordVisibility: discordVisibilities.includes(discord.visibility || "") ? discord.visibility || "public" : "public",
    discordRoleRequirement: discord.roleRequirement || "",
    discordFeatures: Array.isArray(discord.features) ? discord.features.join("\n") : "",
    discordButtonsText: buttonsToText(JSON.stringify(discord.buttons || [])),
    buttonsText: buttonsToText(product?.buttonsJson),
    seoTitle: seo.title || "",
    seoDescription: seo.description || "",
    seoImage: seo.image || "",
  };
}

function toPayload(values: Values, override?: Partial<Values>) {
  const next = { ...values, ...override };

  return {
    name: next.name,
    slug: next.slug,
    shortDescription: next.shortDescription,
    fullDescription: next.fullDescription,
    features: splitList(next.features),
    highlightedFeatures: splitList(next.highlightedFeatures),
    tags: splitList(next.tags),
    featureIcons: splitList(next.featureIcons),
    techStack: splitList(next.techStack),
    faq: splitList(next.faq),
    roadmap: splitList(next.roadmap),
    screenshots: splitList(next.screenshots),
    licenseRules: splitList(next.licenseRules),
    media: {
      cardImage: next.cardImage,
      heroImage: next.heroImage,
      mockupImage: next.mockupImage,
      featuredImage: next.featuredImage,
      galleryImages: splitList(next.galleryImages),
      galleryCaptions: splitList(next.galleryCaptions),
      showcaseImages: splitList(next.showcaseImages),
      showcaseCaptions: splitList(next.showcaseCaptions),
    },
    display: {
      layoutTemplate: next.layoutTemplate,
      featured: next.featured,
      featuredOrder: next.featuredOrder,
      showFeaturedSection: next.showFeaturedSection,
      featuredLayoutStyle: next.featuredLayoutStyle,
      cardStyle: next.cardStyle,
      heroStyle: next.heroStyle,
      accentColor: next.accentColor,
      badgeText: next.badgeText,
      statusBadgeText: next.statusBadgeText,
      showProgress: next.showProgress,
      progressLabel: next.progressLabel,
      progressValue: next.progressValue,
      progressColor: next.progressColor,
      progressPlacement: next.progressPlacement,
      showMockup: next.showMockup,
      detailTabs: splitList(next.detailTabs),
      detailSectionOrder: splitList(next.detailSectionOrder),
      detailHiddenSections: splitList(next.detailHiddenSections),
      detailSectionTitles: textToRecord(next.detailSectionTitles),
      featureCategories: textToFeatureCategories(next.featureCategories),
      featurePaginationLimit: next.featurePaginationLimit,
      discord: {
        enabled: next.discordEnabled,
        title: next.discordTitle,
        subtitle: next.discordSubtitle,
        description: next.discordDescription,
        bannerImage: next.discordBannerImage,
        artworkImage: next.discordArtworkImage,
        thumbnailImage: next.discordThumbnailImage,
        accentColor: next.discordAccentColor,
        channelKey: next.discordChannelKey,
        visibility: next.discordVisibility,
        roleRequirement: next.discordRoleRequirement,
        features: splitList(next.discordFeatures),
        buttons: textToButtons(next.discordButtonsText),
      },
    },
    buttons: textToButtons(next.buttonsText),
    seo: {
      title: next.seoTitle,
      description: next.seoDescription,
      image: next.seoImage,
    },
    price: next.price,
    priceCents: next.priceCents,
    currency: next.currency,
    defaultActivationLimit: next.defaultActivationLimit,
    category: next.category,
    version: next.version,
    changelog: splitList(next.changelog),
    documentationLink: next.documentationLink,
    supportLink: next.supportLink,
    purchaseButtonText: next.purchaseButtonText,
    icon: next.icon,
    status: next.status,
    visible: next.visible,
  };
}

function readinessForValues(values: Values, counts?: ProductItem["_count"]) {
  const isActive = isLiveProductStatus(values.status);
  const isComingSoon = isPrelaunchProductStatus(values.status);
  const isInfrastructure = /infrastructure|api/i.test(`${values.category} ${values.name}`);
  const screenshotCount = splitList(values.galleryImages).length + splitList(values.showcaseImages).length;
  const priceReady = Number(values.priceCents) > 0 || /^free$/i.test(values.price.trim()) || /^infrastructure$/i.test(values.price.trim());
  const checks = [
    { label: "Name", ready: values.name.trim().length >= 2, critical: true },
    { label: "Slug", ready: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug), critical: true },
    { label: "Short description", ready: values.shortDescription.trim().length >= 16, critical: true },
    { label: "Full description", ready: values.fullDescription.trim().length >= 40, critical: true },
    { label: "Pricing", ready: priceReady && !/tbd|placeholder/i.test(values.price), critical: isActive },
    { label: "Layout template", ready: layoutTemplates.includes(values.layoutTemplate), critical: true },
    { label: "Accent color", ready: /^#[0-9a-f]{3,8}$/i.test(values.accentColor) || values.accentColor.startsWith("rgb"), critical: false },
    { label: "License rules", ready: splitList(values.licenseRules).length > 0, critical: true },
    { label: "Activation limit", ready: Number(values.defaultActivationLimit) > 0, critical: true },
    { label: "Docs link or article", ready: Boolean(values.documentationLink) || Boolean(counts?.documentation), critical: isActive },
    { label: "Support path", ready: Boolean(values.supportLink), critical: isActive },
    { label: "Download file or coming soon mode", ready: Boolean(counts?.downloads) || isComingSoon, critical: isActive },
    { label: "Product screenshots/showcase", ready: isInfrastructure || screenshotCount > 0, critical: false },
    { label: "Release record", ready: isInfrastructure || Boolean(counts?.releases) || isComingSoon, critical: isActive },
    { label: "Public buttons", ready: textToButtons(values.buttonsText).length > 0 || Boolean(values.purchaseButtonText), critical: false },
    { label: "Feature list", ready: splitList(values.features).length > 0, critical: false },
    { label: "SEO description", ready: values.seoDescription.trim().length > 30, critical: false },
  ];
  const complete = checks.filter((check) => check.ready).length;
  const criticalMissing = checks.filter((check) => !check.ready && check.critical).map((check) => check.label);
  const missing = checks.filter((check) => !check.ready).map((check) => check.label);

  return {
    score: Math.round((complete / checks.length) * 100),
    checks,
    criticalMissing,
    missing,
  };
}

export function ProductAdminManager({ products }: { products: ProductItem[] }) {
  const [items, setItems] = useState(products);
  const [filter, setFilter] = useState("All");
  const visibleItems = useMemo(() => {
    if (filter === "All") return items;
    if (filter === "Published") return items.filter((item) => item.visible && isLiveProductStatus(item.status));
    if (filter === "Drafts") return items.filter((item) => !item.visible || ["Draft", "Private", "Hidden", "Coming Soon", "In Development", "Planned", "Active Development"].includes(item.status));
    return items.filter((item) => item.status === filter);
  }, [filter, items]);

  function upsert(product: ProductItem) {
    setItems((current) => {
      const exists = current.some((item) => item.id === product.id);
      return exists ? current.map((item) => (item.id === product.id ? product : item)) : [product, ...current];
    });
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-6">
      <ProductEditor mode="create" onSaved={upsert} />

      <section className="surface rounded-lg p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Product library</h2>
            <p className="mt-1 text-sm text-white/46">Filter records, then open a product to control its public layout, media, CTAs, and detail page.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", "Published", "Drafts", "In Development", "Planned", "Active Development", "Coming Soon", "Beta", "Internal", "Private", "Archived", "Retired"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cn(
                  "rounded-md border px-3 py-2 text-xs font-semibold transition",
                  filter === item ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.03] text-white/54 hover:text-white",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4">
        {visibleItems.map((product) => (
          <details key={product.id} className="surface rounded-lg p-5">
            <summary className="cursor-pointer list-none">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">
                    {product.category} / {product.status}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{product.name}</h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-white/52">{product.shortDescription}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={`/products/${product.slug}`} target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/66 transition hover:border-[#ff6262]/35 hover:text-white">
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    Preview
                  </a>
                  <button type="button" onClick={() => remove(product.id)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff5f6d]/28 bg-[#ff5f6d]/10 px-3 text-sm font-semibold text-[#ffd0dc]">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>
            </summary>
            <div className="mt-5">
              <ProductEditor product={product} mode="edit" onSaved={upsert} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function ProductEditor({
  product,
  mode,
  onSaved,
}: {
  product?: ProductItem;
  mode: "create" | "edit";
  onSaved: (product: ProductItem) => void;
}) {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [values, setValues] = useState(valuesFromProduct(product));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [uploadStatus, setUploadStatus] = useState("");

  function update(key: keyof Values, value: string | boolean) {
    setValues((current) => ({ ...current, [key]: value }));
    setStatus("idle");
  }

  async function uploadMedia(slot: MediaSlot, file: File) {
    if (!product?.id) {
      setUploadStatus("Save this product first, then upload images.");
      return;
    }

    setUploadStatus(`Uploading ${file.name}...`);
    const formData = new FormData();
    formData.append("slot", slot);
    formData.append("file", file);

    const response = await fetch(`/api/admin/products/${product.id}/media`, {
      method: "POST",
      body: formData,
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok && result.product) {
      onSaved(result.product);
      setValues(valuesFromProduct(result.product));
      setUploadStatus(`Uploaded ${result.path}`);
      return;
    }

    setUploadStatus(result.message || "Upload failed.");
  }

  async function save(kind: "draft" | "publish") {
    const readiness = readinessForValues(
      { ...values, ...(kind === "publish" ? { visible: true, status: "Published" } : {}) },
      product?._count,
    );
    if (kind === "publish" && readiness.criticalMissing.length) {
      const confirmed = window.confirm(
        `This product is missing critical launch fields:\n\n${readiness.criticalMissing.join("\n")}\n\nPublish anyway?`,
      );
      if (!confirmed) return;
    }

    setStatus("saving");
    const override = kind === "publish" ? { visible: true, status: "Published" } : { visible: false, status: isLiveProductStatus(values.status) ? "Draft" : values.status };
    const response = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
      method: product ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(values, override)),
    });
    const result = await response.json().catch(() => ({}));
    if (result.product) {
      onSaved(result.product);
      setValues(valuesFromProduct(result.product));
    }
    setStatus(response.ok ? "saved" : "error");
  }

  return (
    <section className={mode === "create" ? "surface-strong rounded-lg p-5" : "rounded-lg border border-white/8 bg-black/18 p-4"}>
      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">{mode === "create" ? "Create product" : "Edit product"}</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{values.name || "Untitled product"}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => save("draft")} disabled={status === "saving"} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/70 transition hover:border-[#ff6262]/35 hover:text-white disabled:opacity-60">
                <Save className="h-4 w-4" aria-hidden="true" />
                Save Draft
              </button>
              <button type="button" onClick={() => save("publish")} disabled={status === "saving"} className="button-shine inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black disabled:opacity-60">
                {status === "saved" ? <Check className="relative z-10 h-4 w-4" aria-hidden="true" /> : <Send className="relative z-10 h-4 w-4" aria-hidden="true" />}
                <span className="relative z-10">{status === "saving" ? "Saving..." : "Publish"}</span>
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-md border px-3 py-2 text-xs font-semibold transition",
                  activeTab === tab ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.03] text-white/54 hover:text-white",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <TabFields
              tab={activeTab}
              values={values}
              update={update}
              canUpload={Boolean(product?.id)}
              uploadStatus={uploadStatus}
              uploadMedia={uploadMedia}
            />
          </div>

          {status === "error" ? <p className="mt-4 text-sm text-[#ffd0dc]">Unable to save product. Check required fields, URL formats, and media paths.</p> : null}
          {status === "saved" ? <p className="mt-4 text-sm text-[#ffd8d8]">Product saved.</p> : null}
        </div>

        <ProductPreview values={values} counts={product?._count} />
      </div>
    </section>
  );
}

function TabFields({
  tab,
  values,
  update,
  canUpload,
  uploadStatus,
  uploadMedia,
}: {
  tab: string;
  values: Values;
  update: (key: keyof Values, value: string | boolean) => void;
  canUpload: boolean;
  uploadStatus: string;
  uploadMedia: (slot: MediaSlot, file: File) => void;
}) {
  if (tab === "Basics") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" value={values.name} onChange={(value) => update("name", value)} required />
        <Field label="Slug" value={values.slug} onChange={(value) => update("slug", value)} required />
        <Field label="Category" value={values.category} onChange={(value) => update("category", value)} />
        <Select label="Status" value={values.status} options={statuses} onChange={(value) => update("status", value)} />
        <Field label="Short description" value={values.shortDescription} onChange={(value) => update("shortDescription", value)} className="md:col-span-2" required />
        <TextArea label="Long description" value={values.fullDescription} onChange={(value) => update("fullDescription", value)} className="md:col-span-2" />
        <Toggle label="Visible on public site" checked={values.visible} onChange={(checked) => update("visible", checked)} />
      </div>
    );
  }

  if (tab === "Pricing") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Price label" value={values.price} onChange={(value) => update("price", value)} helper="Examples: $20, Free, Infrastructure, Contact." />
        <Field label="Price cents" value={values.priceCents} onChange={(value) => update("priceCents", value)} helper="$20 should be 2000. Free should be 0." />
        <Select label="Currency" value={values.currency} options={currencies} onChange={(value) => update("currency", value)} />
        <Field label="Fallback purchase button text" value={values.purchaseButtonText} onChange={(value) => update("purchaseButtonText", value)} />
        <Toggle label="Payment ready" checked={values.visible && isLiveProductStatus(values.status)} onChange={(checked) => update("status", checked ? "Published" : "Private")} helper="Use the Buttons tab for the actual public CTA destinations." />
      </div>
    );
  }

  if (tab === "Features") {
    return (
      <div className="grid gap-4">
        <TextArea label="Feature list" value={values.features} onChange={(value) => update("features", value)} helper="One feature per line. Public sections hide when empty." />
        <TextArea label="Highlighted features" value={values.highlightedFeatures} onChange={(value) => update("highlightedFeatures", value)} helper="Used for flagship callouts and detail-page selling points." />
        <TextArea label="Product tags" value={values.tags} onChange={(value) => update("tags", value)} helper="Short chips such as GUI, Licensing, Paper, Discord." />
        <TextArea label="Feature icons" value={values.featureIcons} onChange={(value) => update("featureIcons", value)} helper="Optional lucide icon names aligned to features, one per line." />
        <TextArea label="Technical stack" value={values.techStack} onChange={(value) => update("techStack", value)} />
      </div>
    );
  }

  if (tab === "Media") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <MediaField
          label="Optional card image path"
          value={values.cardImage}
          slot="cardImage"
          canUpload={canUpload}
          onChange={(value) => update("cardImage", value)}
          onUpload={uploadMedia}
          helper="Stored for compatibility. Public product cards use icons, not images."
        />
        <MediaField
          label="Optional hero image path"
          value={values.heroImage}
          slot="heroImage"
          canUpload={canUpload}
          onChange={(value) => update("heroImage", value)}
          onUpload={uploadMedia}
          helper="Only used on product detail if Hero style is set to image. Default hero artwork is icon-based."
        />
        <MediaField
          label="Legacy mockup image"
          value={values.mockupImage}
          slot="mockupImage"
          canUpload={canUpload}
          onChange={(value) => update("mockupImage", value)}
          onUpload={uploadMedia}
          helper="Use Showcase images below for real screenshots. Mockup panels are hidden by default."
        />
        <MediaField
          label="Legacy featured image"
          value={values.featuredImage}
          slot="featuredImage"
          canUpload={canUpload}
          onChange={(value) => update("featuredImage", value)}
          onUpload={uploadMedia}
          helper="Featured storefront panels use icons. Keep this only for future/manual use."
        />
        <div className="grid gap-3 md:col-span-2">
          <TextArea label="Gallery images" value={values.galleryImages} onChange={(value) => update("galleryImages", value)} helper="One image path or URL per line. Gallery hides when empty." />
          <FileUploadButton slot="galleryImages" canUpload={canUpload} onUpload={uploadMedia} label="Upload gallery PNG" />
        </div>
        <TextArea label="Gallery captions" value={values.galleryCaptions} onChange={(value) => update("galleryCaptions", value)} className="md:col-span-2" helper="One caption per line, matching the gallery image order." />
        <div className="grid gap-3 md:col-span-2">
          <TextArea label="Showcase images" value={values.showcaseImages} onChange={(value) => update("showcaseImages", value)} helper="Use this for screenshots, UI previews, Discord panels, Minecraft GUIs, and real product visuals." />
          <FileUploadButton slot="showcaseImages" canUpload={canUpload} onUpload={uploadMedia} label="Upload showcase PNG" />
        </div>
        <TextArea label="Showcase captions" value={values.showcaseCaptions} onChange={(value) => update("showcaseCaptions", value)} className="md:col-span-2" helper="One caption per line, matching the showcase image order." />
        <TextArea label="Legacy screenshot labels / release asset notes" value={values.screenshots} onChange={(value) => update("screenshots", value)} className="md:col-span-2" helper="Kept for older product records and release notes. It does not create fake mockups." />
        {uploadStatus ? <p className="md:col-span-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/54">{uploadStatus}</p> : null}
        {!canUpload ? <p className="md:col-span-2 text-xs text-[#ffd0dc]">Create or save the product first, then image uploads will unlock.</p> : null}
      </div>
    );
  }

  if (tab === "Layout") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Icon name" value={values.icon} onChange={(value) => update("icon", value)} helper="Examples: Swords, Shield, Castle, Pickaxe, Gem, Cloud, Sprout, Bot, Ticket." />
        <Select label="Product layout template" value={values.layoutTemplate} options={layoutTemplates} onChange={(value) => update("layoutTemplate", value)} />
        <Select label="Featured layout style" value={values.featuredLayoutStyle} options={featuredLayoutStyles} onChange={(value) => update("featuredLayoutStyle", value)} />
        <Select label="Card style" value={values.cardStyle} options={cardStyles} onChange={(value) => update("cardStyle", value)} />
        <Select label="Hero style" value={values.heroStyle} options={heroStyles} onChange={(value) => update("heroStyle", value)} />
        <Toggle label="Featured product" checked={values.featured} onChange={(checked) => update("featured", checked)} helper="Featured records appear in the premium storefront area when the section is enabled." />
        <Toggle label="Show featured section" checked={values.showFeaturedSection} onChange={(checked) => update("showFeaturedSection", checked)} />
        <Field label="Featured order" value={values.featuredOrder} onChange={(value) => update("featuredOrder", value)} />
        <Field label="Accent color" value={values.accentColor} onChange={(value) => update("accentColor", value)} helper="Use a hex value such as #ff6262." />
        <Field label="Badge text" value={values.badgeText} onChange={(value) => update("badgeText", value)} />
        <Field label="Status badge override" value={values.statusBadgeText} onChange={(value) => update("statusBadgeText", value)} />
        <Toggle label="Show progress bar" checked={values.showProgress} onChange={(checked) => update("showProgress", checked)} />
        <Field label="Progress label" value={values.progressLabel} onChange={(value) => update("progressLabel", value)} />
        <Field label="Progress value" value={values.progressValue} onChange={(value) => update("progressValue", value)} helper="0-100. Hidden unless progress is enabled." />
        <Field label="Progress color" value={values.progressColor} onChange={(value) => update("progressColor", value)} helper="Optional hex color. Falls back to accent color." />
        <Select label="Progress placement" value={values.progressPlacement} options={progressPlacements} onChange={(value) => update("progressPlacement", value)} />
        <Toggle label="Show mockup panel" checked={values.showMockup} onChange={(checked) => update("showMockup", checked)} helper="Only renders publicly when a mockup image is also configured." />
      </div>
    );
  }

  if (tab === "Detail UX") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <TextArea
          label="Enabled product tabs"
          value={values.detailTabs}
          onChange={(value) => update("detailTabs", value)}
          helper="One per line: overview, features, showcase, documentation, licensing, roadmap, faq, changelog."
        />
        <TextArea
          label="Section order"
          value={values.detailSectionOrder}
          onChange={(value) => update("detailSectionOrder", value)}
          helper="One section key per line. Empty sections still hide automatically."
        />
        <TextArea
          label="Hidden sections"
          value={values.detailHiddenSections}
          onChange={(value) => update("detailHiddenSections", value)}
          helper="One section key per line. Use this to hide configured sections per product."
        />
        <TextArea
          label="Section title overrides"
          value={values.detailSectionTitles}
          onChange={(value) => update("detailSectionTitles", value)}
          helper="One per line: section|Custom title. Example: features|Factions systems."
        />
        <TextArea
          label="Feature categories"
          value={values.featureCategories}
          onChange={(value) => update("featureCategories", value)}
          className="md:col-span-2"
          helper="One per line: Category|Feature. If empty, public pages auto-group the normal feature list."
        />
        <Field
          label="Feature default limit"
          value={values.featurePaginationLimit}
          onChange={(value) => update("featurePaginationLimit", value)}
          helper="How many features show before the Show all button. Recommended: 6-8."
        />
      </div>
    );
  }

  if (tab === "Discord") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Toggle label="Enable Discord product panel" checked={values.discordEnabled} onChange={(checked) => update("discordEnabled", checked)} />
        <Select label="Discord visibility" value={values.discordVisibility} options={discordVisibilities} onChange={(value) => update("discordVisibility", value)} />
        <Field label="Panel title" value={values.discordTitle} onChange={(value) => update("discordTitle", value)} helper="Falls back to the product name when empty." />
        <Field label="Panel subtitle" value={values.discordSubtitle} onChange={(value) => update("discordSubtitle", value)} helper="Short positioning line, such as Commercial Plugin." />
        <TextArea
          label="Discord description"
          value={values.discordDescription}
          onChange={(value) => update("discordDescription", value)}
          className="md:col-span-2"
          helper="Keep this short. Discord panels should market; the website documents."
        />
        <MediaField
          label="Discord banner"
          value={values.discordBannerImage}
          slot="featuredImage"
          canUpload={canUpload}
          onChange={(value) => update("discordBannerImage", value)}
          onUpload={uploadMedia}
          helper="Wide optional banner. Relative paths are converted to the site URL by the bot."
        />
        <MediaField
          label="Discord artwork"
          value={values.discordArtworkImage}
          slot="showcaseImages"
          canUpload={canUpload}
          onChange={(value) => update("discordArtworkImage", value)}
          onUpload={uploadMedia}
          helper="Optional square/hero artwork. The bot falls back gracefully when empty."
        />
        <MediaField
          label="Discord thumbnail"
          value={values.discordThumbnailImage}
          slot="cardImage"
          canUpload={canUpload}
          onChange={(value) => update("discordThumbnailImage", value)}
          onUpload={uploadMedia}
          helper="Small logo or icon artwork."
        />
        <Field label="Discord accent color" value={values.discordAccentColor} onChange={(value) => update("discordAccentColor", value)} helper="Hex color. Falls back to product accent." />
        <Field label="Discord channel key" value={values.discordChannelKey} onChange={(value) => update("discordChannelKey", value)} helper="Optional setup channel key. Example: mxfFactions." />
        <Field label="Role requirement" value={values.discordRoleRequirement} onChange={(value) => update("discordRoleRequirement", value)} helper="Optional public note such as Verified Customer." />
        <TextArea label="Discord feature bullets" value={values.discordFeatures} onChange={(value) => update("discordFeatures", value)} className="md:col-span-2" helper="One short bullet per line. Recommended: 3-4." />
        <TextArea
          label="Discord buttons"
          value={values.discordButtonsText}
          onChange={(value) => update("discordButtonsText", value)}
          className="md:col-span-2"
          helper="One per line: Label|/path-or-url|primary. Recommended labels: View Product, Documentation, Support, Waitlist."
        />
        {uploadStatus ? <p className="md:col-span-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/54">{uploadStatus}</p> : null}
      </div>
    );
  }

  if (tab === "Buttons") {
    return (
      <div className="grid gap-4">
        <TextArea
          label="Public CTA buttons"
          value={values.buttonsText}
          onChange={(value) => update("buttonsText", value)}
          helper="One per line: Label|/path-or-url|primary. Styles: primary, secondary, ghost."
        />
        <Field label="Fallback purchase button text" value={values.purchaseButtonText} onChange={(value) => update("purchaseButtonText", value)} />
      </div>
    );
  }

  if (tab === "Roadmap") {
    return (
      <div className="grid gap-4">
        <TextArea label="Roadmap items" value={values.roadmap} onChange={(value) => update("roadmap", value)} />
        <TextArea label="Changelog" value={values.changelog} onChange={(value) => update("changelog", value)} />
      </div>
    );
  }

  if (tab === "Docs") {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Docs URL" value={values.documentationLink} onChange={(value) => update("documentationLink", value)} />
          <Field label="Support URL" value={values.supportLink} onChange={(value) => update("supportLink", value)} />
        </div>
        <TextArea label="FAQ" value={values.faq} onChange={(value) => update("faq", value)} helper="Question and answer on one line works best. Public FAQ hides when empty." />
      </div>
    );
  }

  if (tab === "License Rules") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Default activations" value={values.defaultActivationLimit} onChange={(value) => update("defaultActivationLimit", value)} />
        <Field label="Current version" value={values.version} onChange={(value) => update("version", value)} />
        <TextArea label="License rules / reset policy" value={values.licenseRules} onChange={(value) => update("licenseRules", value)} className="md:col-span-2" />
        <Toggle label="HWID lock referenced" checked={values.licenseRules.toLowerCase().includes("hwid")} onChange={() => null} helper="Document HWID/IP/Discord ownership rules in the license rules field when relevant." />
        <Toggle label="IP lock referenced" checked={values.licenseRules.toLowerCase().includes("ip")} onChange={() => null} helper="Document IP policy only when this product requires it." />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="SEO title" value={values.seoTitle} onChange={(value) => update("seoTitle", value)} />
      <Field label="SEO image" value={values.seoImage} onChange={(value) => update("seoImage", value)} />
      <Field label="Icon" value={values.icon} onChange={(value) => update("icon", value)} helper="Lucide icon name used in admin and lightweight public metadata." />
      <TextArea label="SEO description" value={values.seoDescription} onChange={(value) => update("seoDescription", value)} className="md:col-span-2" />
    </div>
  );
}

function ProductPreview({ values, counts }: { values: Values; counts?: ProductItem["_count"] }) {
  const readiness = readinessForValues(values, counts);
  const buttonCount = textToButtons(values.buttonsText).length;

  return (
    <aside className="surface h-fit rounded-lg p-4">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Public preview</p>
      <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-black/24">
        <div className="relative h-36 overflow-hidden bg-[#070a0f]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:30px_30px]" />
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-3xl" style={{ background: values.accentColor || "#ff6262" }} />
          <div className="relative grid h-full place-items-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.055]" style={{ color: values.accentColor || "#ff6262" }}>
              <ProductIconGlyph name={values.icon} className="h-8 w-8" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="h-1 rounded-sm" style={{ background: values.accentColor || "#ff6262" }} />
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs" style={{ color: values.accentColor || "#ff6262" }}>{values.category || "Product"}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{values.name || "Untitled product"}</h3>
            </div>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/54">{values.statusBadgeText || values.status}</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/54">{values.shortDescription || "Short product description appears here."}</p>
          {values.showProgress && values.progressPlacement !== "hidden" ? (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-white/42">
                <span>{values.progressLabel || "Progress"}</span>
                <span>{Math.max(0, Math.min(100, Number(values.progressValue) || 0))}% / {values.progressPlacement}</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/8">
                <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, Number(values.progressValue) || 0))}%`, background: values.progressColor || values.accentColor || "#ff6262" }} />
              </div>
            </div>
          ) : null}
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="font-mono text-sm text-white/50">{values.price}</p>
            <p className="text-xs text-white/36">{values.cardStyle} / {values.heroStyle}</p>
          </div>
          <div className="mt-5 flex min-h-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-sm font-semibold text-white/72">
            {buttonCount ? `${buttonCount} public CTA${buttonCount === 1 ? "" : "s"}` : values.purchaseButtonText || "Learn More"}
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-md border border-white/8 bg-white/[0.03] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-white/62">Product readiness</p>
          <p className="font-mono text-xs text-[#ff6262]">{readiness.score}%</p>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-white/8">
          <div className="h-full rounded-full bg-gradient-to-r from-[#ff9f7a] to-[#ff6262]" style={{ width: `${readiness.score}%` }} />
        </div>
        {readiness.criticalMissing.length ? (
          <p className="mt-3 text-xs leading-5 text-[#ffd0dc]">Critical: {readiness.criticalMissing.slice(0, 3).join(", ")}</p>
        ) : null}
      </div>
      <p className="mt-3 text-xs leading-5 text-white/40">Product cards and storefront panels use icons. Uploaded images render in the product showcase/gallery.</p>
    </aside>
  );
}

function MediaField({
  label,
  value,
  slot,
  canUpload,
  onChange,
  onUpload,
  helper,
}: {
  label: string;
  value: string;
  slot: MediaSlot;
  canUpload: boolean;
  onChange: (value: string) => void;
  onUpload: (slot: MediaSlot, file: File) => void;
  helper?: string;
}) {
  return (
    <div className="grid gap-3">
      <Field label={label} value={value} onChange={onChange} helper={helper} />
      <FileUploadButton slot={slot} canUpload={canUpload} onUpload={onUpload} label={`Upload ${label.toLowerCase()} PNG`} />
    </div>
  );
}

function FileUploadButton({
  slot,
  canUpload,
  onUpload,
  label,
}: {
  slot: MediaSlot;
  canUpload: boolean;
  onUpload: (slot: MediaSlot, file: File) => void;
  label: string;
}) {
  return (
    <label className={cn(
      "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition",
      canUpload ? "border-white/10 bg-white/[0.04] text-white/66 hover:border-[#ff6262]/35 hover:text-white" : "cursor-not-allowed border-white/8 bg-white/[0.02] text-white/28",
    )}>
      <Upload className="h-4 w-4" aria-hidden="true" />
      {label}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        disabled={!canUpload}
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) {
            onUpload(slot, file);
          }
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  helper,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helper?: string;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60" />
      {helper ? <span className="text-xs text-white/40">{helper}</span> : null}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  helper,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <textarea value={value} rows={5} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#ff6262]/60" />
      {helper ? <span className="text-xs text-white/40">{helper}</span> : null}
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onChange, helper }: { label: string; checked: boolean; onChange: (checked: boolean) => void; helper?: string }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-white/10 bg-black/24 px-3 py-3">
      <span>
        <span className="block text-sm font-semibold text-white/72">{label}</span>
        {helper ? <span className="mt-1 block text-xs text-white/40">{helper}</span> : null}
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
