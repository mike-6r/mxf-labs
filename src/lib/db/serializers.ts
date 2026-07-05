import type { Product, Project } from "@prisma/client";
import type { Accent, ProjectCategory } from "@/lib/content";
import { normalizeProductProgressPlacement, type ProductProgressPlacement } from "@/lib/products/progress";

export type ProductMedia = {
  cardImage?: string;
  heroImage?: string;
  mockupImage?: string;
  featuredImage?: string;
  galleryImages: string[];
  galleryCaptions: string[];
  showcaseImages: string[];
  showcaseCaptions: string[];
};

export type ProductDisplay = {
  layoutTemplate: "flagship" | "compact" | "coming-soon" | "free" | "infrastructure-api";
  featured: boolean;
  featuredOrder: number;
  showFeaturedSection: boolean;
  featuredLayoutStyle: "cinematic" | "split" | "editorial" | "compact";
  cardStyle: "orbital" | "minimal" | "terminal" | "stacked";
  heroStyle: "constellation" | "minimal" | "terminal" | "stacked" | "image";
  accentColor: string;
  badgeText?: string;
  statusBadgeText?: string;
  showProgress: boolean;
  progressLabel?: string;
  progressValue: number;
  progressColor?: string;
  progressPlacement: ProductProgressPlacement;
  showMockup: boolean;
  detailTabs: string[];
  detailSectionOrder: string[];
  detailHiddenSections: string[];
  detailSectionTitles: Record<string, string>;
  featureCategories: Array<{ title: string; items: string[] }>;
  featurePaginationLimit: number;
};

export type ProductButton = {
  label: string;
  href: string;
  style: "primary" | "secondary" | "ghost";
};

export type ProductSeo = {
  title?: string;
  description?: string;
  image?: string;
};

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function parseJsonObject<T extends object>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? { ...fallback, ...parsed } : fallback;
  } catch {
    return fallback;
  }
}

export function stringifyList(value: string[] | string | undefined) {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => item.trim()).filter(Boolean));
  }

  if (typeof value === "string") {
    return JSON.stringify(splitList(value));
  }

  return "[]";
}

export function splitList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function statusToAccent(status: string): Accent {
  if (["Active", "Published", "Public", "Live", "Available", "Release"].includes(status)) {
    return "lime";
  }

  if (["Private", "Hidden", "Private Build", "Archived", "Retired", "Alert"].includes(status)) {
    return "rose";
  }

  if (["Coming Soon", "Draft", "Beta", "In Progress", "In Development", "Planned", "Active Development", "Maintenance"].includes(status)) {
    return "amber";
  }

  return "cyan";
}

export function projectCategoryToPublic(category: string): ProjectCategory {
  if (category === "Discord Bot") return "Discord Bots";
  if (category === "Minecraft Plugin") return "Minecraft Plugins";
  if (category === "Web Panel") return "Web Panels";
  if (category === "Product" || category === "API") return "Products";
  return "Websites";
}

function normalizeMedia(value: string): ProductMedia {
  const media = parseJsonObject<ProductMedia>(value, {
    cardImage: "",
    heroImage: "",
    mockupImage: "",
    featuredImage: "",
    galleryImages: [],
    galleryCaptions: [],
    showcaseImages: [],
    showcaseCaptions: [],
  });

  return {
    ...media,
    galleryImages: Array.isArray(media.galleryImages) ? media.galleryImages.map(String).filter(Boolean) : [],
    galleryCaptions: Array.isArray(media.galleryCaptions) ? media.galleryCaptions.map(String) : [],
    showcaseImages: Array.isArray(media.showcaseImages) ? media.showcaseImages.map(String).filter(Boolean) : [],
    showcaseCaptions: Array.isArray(media.showcaseCaptions) ? media.showcaseCaptions.map(String) : [],
  };
}

function normalizeDisplay(value: string): ProductDisplay {
  const display = parseJsonObject<ProductDisplay>(value, {
    layoutTemplate: "compact",
    featured: false,
    featuredOrder: 0,
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
    detailTabs: ["overview", "features", "showcase", "documentation", "licensing", "roadmap", "faq", "changelog"],
    detailSectionOrder: ["overview", "features", "showcase", "documentation", "licensing", "roadmap", "faq"],
    detailHiddenSections: [],
    detailSectionTitles: {},
    featureCategories: [],
    featurePaginationLimit: 8,
  });

  return {
    ...display,
    featured: Boolean(display.featured),
    featuredOrder: Number(display.featuredOrder) || 0,
    showFeaturedSection: display.showFeaturedSection !== false,
    cardStyle: ["orbital", "minimal", "terminal", "stacked"].includes(display.cardStyle) ? display.cardStyle : "orbital",
    heroStyle: ["constellation", "minimal", "terminal", "stacked", "image"].includes(display.heroStyle) ? display.heroStyle : "constellation",
    showProgress: Boolean(display.showProgress),
    progressValue: Math.max(0, Math.min(100, Number(display.progressValue) || 0)),
    progressColor: String(display.progressColor || "").trim(),
    progressPlacement: normalizeProductProgressPlacement(display.progressPlacement),
    showMockup: Boolean(display.showMockup),
    detailTabs: normalizeStringList(display.detailTabs, ["overview", "features", "showcase", "documentation", "licensing", "roadmap", "faq", "changelog"]),
    detailSectionOrder: normalizeStringList(display.detailSectionOrder, ["overview", "features", "showcase", "documentation", "licensing", "roadmap", "faq"]),
    detailHiddenSections: normalizeStringList(display.detailHiddenSections),
    detailSectionTitles: normalizeStringRecord(display.detailSectionTitles),
    featureCategories: normalizeFeatureCategories(display.featureCategories),
    featurePaginationLimit: Math.max(1, Math.min(30, Number(display.featurePaginationLimit) || 8)),
  };
}

function normalizeStringList(value: unknown, fallback: string[] = []) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : fallback;
}

function normalizeStringRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [String(key).trim(), String(item || "").trim()])
      .filter(([key, item]) => key && item),
  );
}

function normalizeFeatureCategories(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((category) => {
      if (!category || typeof category !== "object" || Array.isArray(category)) return null;
      const record = category as Record<string, unknown>;
      const title = String(record.title || "").trim();
      const items = normalizeStringList(record.items);
      return title && items.length ? { title, items } : null;
    })
    .filter((category): category is { title: string; items: string[] } => Boolean(category));
}

function normalizeButtons(value: string): ProductButton[] {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((button) => ({
        label: String(button?.label || "").trim(),
        href: String(button?.href || "").trim(),
        style: ["primary", "secondary", "ghost"].includes(button?.style) ? button.style : "secondary",
      }))
      .filter((button) => button.label && button.href);
  } catch {
    return [];
  }
}

export function serializeProduct(product: Product) {
  const display = normalizeDisplay(product.displayJson);

  return {
    slug: product.slug,
    name: product.name,
    description: product.shortDescription,
    fullDescription: product.fullDescription,
    features: parseJsonArray(product.featuresJson),
    highlightedFeatures: parseJsonArray(product.highlightedFeaturesJson),
    tags: parseJsonArray(product.tagsJson),
    featureIcons: parseJsonArray(product.featureIconsJson),
    stack: parseJsonArray(product.techStackJson),
    changelog: parseJsonArray(product.changelogJson),
    status: product.status,
    price: product.price,
    priceCents: product.priceCents,
    currency: product.currency,
    faq: parseJsonArray(product.faqJson),
    roadmap: parseJsonArray(product.roadmapJson),
    screenshots: parseJsonArray(product.screenshotsJson),
    licenseRules: parseJsonArray(product.licenseRulesJson),
    media: normalizeMedia(product.mediaJson),
    display,
    buttons: normalizeButtons(product.buttonsJson),
    seo: parseJsonObject<ProductSeo>(product.seoJson, {}),
    category: product.category,
    version: product.version,
    documentationLink: product.documentationLink,
    supportLink: product.supportLink,
    purchaseButtonText: product.purchaseButtonText,
    icon: product.icon,
    accent: statusToAccent(product.status),
    accentColor: display.accentColor || "#ff6262",
  };
}

export function serializeProject(project: Project) {
  return {
    slug: project.slug,
    name: project.title,
    category: projectCategoryToPublic(project.category),
    description: project.description,
    stack: parseJsonArray(project.techStackJson),
    status: project.status,
    caseStudy: project.caseStudy,
    featured: project.featured,
    previewLink: project.previewLink,
    repositoryLabel: project.repositoryLabel,
    accent: statusToAccent(project.status),
  };
}
