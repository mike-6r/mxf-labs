import { getContentQuality, hasUsableContent, isPlaceholderContent, qualityLabel, type ContentQuality } from "@/lib/content-quality";
import { getContentMode } from "@/lib/content-mode";
import { prisma } from "@/lib/db/prisma";
import { getSettings } from "@/lib/db/settings";
import { editableEmailTemplates, emailTemplateKey } from "@/lib/email/template-definitions";
import { isFreePrice, isLiveProductStatus, isPrelaunchProductStatus, isPublicProductStatus } from "@/lib/products/status";
import { getSetupStatus } from "@/lib/setup/status";

export type CompletionStatus = "Complete" | "Missing" | "Needs Review";

export type CompletionArea = {
  id: string;
  label: string;
  status: CompletionStatus;
  score: number;
  complete: number;
  total: number;
  missing: string[];
  review: string[];
  href: string;
};

export type ProductReadinessCheck = {
  label: string;
  ready: boolean;
  critical: boolean;
  review?: boolean;
};

export type ProductReadiness = {
  productId: string;
  name: string;
  slug: string;
  status: string;
  visible: boolean;
  score: number;
  complete: number;
  total: number;
  missing: string[];
  criticalMissing: string[];
  review: string[];
  checks: ProductReadinessCheck[];
};

type ProductForReadiness = Awaited<ReturnType<typeof productReadinessQuery>>[number];

function qualityReady(value: string | null | undefined, minLength = 3) {
  return getContentQuality(value, minLength) === "complete";
}

function parseList(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string" && item.trim()) : [];
  } catch {
    return [];
  }
}

function parseRecord(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function mediaImageCount(value: string) {
  const media = parseRecord(value);
  return ["galleryImages", "showcaseImages"].reduce((total, key) => {
    const list = media[key];
    return total + (Array.isArray(list) ? list.filter((item) => typeof item === "string" && item.trim()).length : 0);
  }, 0);
}

function area({
  id,
  label,
  href,
  checks,
}: {
  id: string;
  label: string;
  href: string;
  checks: Array<{ label: string; quality: ContentQuality; reviewOnly?: boolean }>;
}): CompletionArea {
  const total = checks.length;
  const complete = checks.filter((check) => check.quality === "complete").length;
  const missing = checks.filter((check) => check.quality === "missing").map((check) => check.label);
  const review = checks.filter((check) => check.quality === "needs_review").map((check) => check.label);
  const status: CompletionStatus = missing.length ? "Missing" : review.length ? "Needs Review" : "Complete";

  return {
    id,
    label,
    status,
    score: total ? Math.round((complete / total) * 100) : 0,
    complete,
    total,
    missing,
    review,
    href,
  };
}

function booleanQuality(ready: boolean, review = false): ContentQuality {
  if (ready) return review ? "needs_review" : "complete";
  return "missing";
}

async function productReadinessQuery() {
  return prisma.product.findMany({
    include: {
      _count: {
        select: {
          downloads: true,
          documentation: true,
          releases: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function scoreProductReadiness(product: ProductForReadiness): ProductReadiness {
  const features = parseList(product.featuresJson);
  const faq = parseList(product.faqJson);
  const changelog = parseList(product.changelogJson);
  const licenseRules = parseList(product.licenseRulesJson);
  const screenshotCount = mediaImageCount(product.mediaJson);
  const isLive = isLiveProductStatus(product.status);
  const isInfrastructure = /infrastructure|api/i.test(`${product.category} ${product.name}`);
  const isFree = isFreePrice(product.price, product.priceCents);
  const hasLaunchPrice = product.priceCents > 0 || isFree || isInfrastructure;
  const hasDownloadOrPrelaunch = product._count.downloads > 0 || isPrelaunchProductStatus(product.status) || isInfrastructure;
  const hasDocs = Boolean(product.documentationLink) || product._count.documentation > 0;

  const checks: ProductReadinessCheck[] = [
    { label: "Name", ready: qualityReady(product.name), critical: true },
    { label: "Slug", ready: qualityReady(product.slug), critical: true },
    { label: "Short description", ready: qualityReady(product.shortDescription, 16), critical: true },
    { label: "Full description", ready: qualityReady(product.fullDescription, 40), critical: true },
    { label: "Pricing", ready: hasLaunchPrice && !isPlaceholderContent(product.price), critical: isLive },
    { label: "Status", ready: Boolean(product.status), critical: true },
    { label: "Visibility", ready: product.visible || !isLive, critical: isLive },
    { label: "License rules", ready: licenseRules.length > 0, critical: true },
    { label: "Activation limit", ready: product.defaultActivationLimit > 0, critical: true },
    { label: "Docs link or article", ready: hasDocs, critical: isLive },
    { label: "Support path", ready: Boolean(product.supportLink), critical: isLive },
    { label: "Download file or prelaunch mode", ready: hasDownloadOrPrelaunch, critical: isLive },
    { label: "Product screenshots/showcase", ready: isInfrastructure || screenshotCount > 0, critical: false },
    { label: "Release record", ready: isInfrastructure || product._count.releases > 0 || isPrelaunchProductStatus(product.status), critical: isLive },
    { label: "FAQ", ready: faq.length > 0, critical: false },
    { label: "Changelog", ready: changelog.length > 0 || product._count.releases > 0, critical: false },
    { label: "Purchase enabled", ready: !isLive || isFree || isInfrastructure || (product.visible && product.priceCents > 0), critical: isLive },
    { label: "Feature list", ready: features.length > 0, critical: false },
  ];

  const complete = checks.filter((check) => check.ready).length;
  const missing = checks.filter((check) => !check.ready).map((check) => check.label);
  const criticalMissing = checks.filter((check) => !check.ready && check.critical).map((check) => check.label);
  const review = checks.filter((check) => check.review).map((check) => check.label);

  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    status: product.status,
    visible: product.visible,
    score: Math.round((complete / checks.length) * 100),
    complete,
    total: checks.length,
    missing,
    criticalMissing,
    review,
    checks,
  };
}

export async function getProductReadiness() {
  const products = await productReadinessQuery();
  return products.map(scoreProductReadiness);
}

export async function getLaunchReadiness() {
  const [settings, setup, contentMode, products, docs, downloads, publicAnnouncements] = await Promise.all([
    getSettings([
      "brand.name",
      "brand.logo_text",
      "brand.tagline",
      "brand.short_description",
      "support.email",
      "contact.email",
      "social.discord_invite",
      "social.github",
      "home.hero_headline",
      "home.hero_subheadline",
      "home.primary_cta_text",
      "home.primary_cta_link",
      "home.secondary_cta_text",
      "home.secondary_cta_link",
      "home.featured_product",
      "home.show_stats",
      "home.show_projects",
      "home.show_testimonials",
      "legal.terms",
      "legal.privacy",
      "legal.refunds",
      "legal.support_sla",
      "portal.greeting",
      "portal.empty_state",
      "portal.support_cta",
      "portal.discord_cta",
      "discord.setup.welcome_embed",
      "discord.setup.faq_embed",
      "discord.setup.support_panel",
      "discord.setup.product_panel",
      "discord.setup.ticket_panel",
      "discord.setup.giveaway_embed",
      "discord.setup.suggestion_embed",
      "discord.role.customer_label",
      "discord.role.verified_label",
      "discord.role.premium_support_label",
      "launch.secrets_rotated",
      ...editableEmailTemplates.flatMap((template) => [
        emailTemplateKey(template.id, "subject"),
        emailTemplateKey(template.id, "body"),
      ]),
    ]),
    getSetupStatus(),
    getContentMode(),
    productReadinessQuery(),
    prisma.documentationArticle.findMany({ where: { visible: true }, select: { title: true, excerpt: true, bodyMarkdown: true } }),
    prisma.productDownload.count({ where: { visible: true } }),
    prisma.announcement.findMany({ where: { active: true, visibility: "Public" }, select: { title: true, body: true } }),
  ]);

  const productReadiness = products.map(scoreProductReadiness);
  const publishedProducts = products.filter((product) => product.visible && isPublicProductStatus(product.status));
  const productScore = productReadiness.length
    ? Math.round(productReadiness.reduce((total, item) => total + item.score, 0) / productReadiness.length)
    : 0;
  const paymentReady = setup.statuses.some((item) => ["stripe", "paypal"].includes(item.id) && item.level === "ready");
  const paymentMock = setup.statuses.some((item) => ["stripe", "paypal"].includes(item.id) && item.level === "mock");
  const storageReady = setup.statuses.some((item) => item.id === "local-storage" && item.level === "ready");
  const docsReady = docs.some((doc) => hasUsableContent(doc.title) && hasUsableContent(doc.bodyMarkdown, 40));
  const docsReview = docs.some((doc) => isPlaceholderContent(doc.title, doc.excerpt, doc.bodyMarkdown));
  const demoAnnouncementsPublic = publicAnnouncements.some((announcement) => isPlaceholderContent(announcement.title, announcement.body));

  const areas: CompletionArea[] = [
    area({
      id: "brand",
      label: "Brand",
      href: "/admin/launch-wizard",
      checks: [
        { label: "Site name", quality: getContentQuality(settings["brand.name"]) },
        { label: "Logo text", quality: getContentQuality(settings["brand.logo_text"]) },
        { label: "Tagline", quality: getContentQuality(settings["brand.tagline"], 8) },
        { label: "Short description", quality: getContentQuality(settings["brand.short_description"], 30) },
        { label: "Support email", quality: getContentQuality(settings["support.email"], 6) },
        { label: "Contact email", quality: getContentQuality(settings["contact.email"], 6) },
        { label: "Discord invite", quality: getContentQuality(settings["social.discord_invite"], 8) },
        { label: "GitHub link", quality: getContentQuality(settings["social.github"], 8) },
      ],
    }),
    area({
      id: "homepage",
      label: "Homepage",
      href: "/admin/launch-wizard",
      checks: [
        { label: "Hero headline", quality: getContentQuality(settings["home.hero_headline"]) },
        { label: "Hero subheadline", quality: getContentQuality(settings["home.hero_subheadline"], 30) },
        { label: "Primary CTA", quality: getContentQuality(settings["home.primary_cta_text"]) },
        { label: "Primary CTA link", quality: getContentQuality(settings["home.primary_cta_link"]) },
        { label: "Secondary CTA", quality: getContentQuality(settings["home.secondary_cta_text"]) },
        { label: "Featured product", quality: getContentQuality(settings["home.featured_product"]) },
        { label: "Section toggles reviewed", quality: booleanQuality(["home.show_stats", "home.show_projects", "home.show_testimonials"].every((key) => settings[key])) },
      ],
    }),
    {
      id: "products",
      label: "Products",
      href: "/admin/products",
      status: publishedProducts.length && productScore >= 85 ? "Complete" : productReadiness.length ? "Needs Review" : "Missing",
      score: productReadiness.length ? productScore : 0,
      complete: productReadiness.filter((item) => item.score >= 85).length,
      total: Math.max(productReadiness.length, 1),
      missing: productReadiness.length ? productReadiness.flatMap((item) => item.criticalMissing.map((missing) => `${item.name}: ${missing}`)).slice(0, 8) : ["At least one product"],
      review: productReadiness.filter((item) => item.score < 85).map((item) => `${item.name}: ${item.score}% ready`),
    },
    area({
      id: "docs",
      label: "Docs",
      href: "/admin/documentation",
      checks: [
        { label: "Visible docs article", quality: docsReady ? (docsReview ? "needs_review" : "complete") : "missing" },
      ],
    }),
    area({
      id: "legal",
      label: "Legal",
      href: "/admin/launch-wizard",
      checks: [
        { label: "Terms", quality: getContentQuality(settings["legal.terms"], 80) },
        { label: "Privacy", quality: getContentQuality(settings["legal.privacy"], 80) },
        { label: "Refund policy", quality: getContentQuality(settings["legal.refunds"], 40) },
        { label: "Support SLA", quality: getContentQuality(settings["legal.support_sla"], 20) },
      ],
    }),
    area({
      id: "emails",
      label: "Emails",
      href: "/admin/emails",
      checks: editableEmailTemplates.slice(0, 7).flatMap((template) => [
        { label: `${template.label} subject`, quality: getContentQuality(settings[emailTemplateKey(template.id, "subject")]) },
        { label: `${template.label} body`, quality: getContentQuality(settings[emailTemplateKey(template.id, "body")], 20) },
      ]),
    }),
    area({
      id: "discord",
      label: "Discord",
      href: "/admin/launch-wizard",
      checks: [
        { label: "Welcome embed", quality: getContentQuality(settings["discord.setup.welcome_embed"], 20) },
        { label: "FAQ embed", quality: getContentQuality(settings["discord.setup.faq_embed"], 20) },
        { label: "Support panel", quality: getContentQuality(settings["discord.setup.support_panel"], 20) },
        { label: "Ticket panel", quality: getContentQuality(settings["discord.setup.ticket_panel"], 20) },
        { label: "Product panel", quality: getContentQuality(settings["discord.setup.product_panel"], 20) },
        { label: "Giveaway embed", quality: getContentQuality(settings["discord.setup.giveaway_embed"], 20) },
        { label: "Suggestion embed", quality: getContentQuality(settings["discord.setup.suggestion_embed"], 20) },
        { label: "Role labels", quality: booleanQuality(["discord.role.customer_label", "discord.role.verified_label", "discord.role.premium_support_label"].every((key) => hasUsableContent(settings[key]))) },
      ],
    }),
    area({
      id: "portal",
      label: "Portal",
      href: "/admin/launch-wizard",
      checks: [
        { label: "Greeting", quality: getContentQuality(settings["portal.greeting"]) },
        { label: "Empty state", quality: getContentQuality(settings["portal.empty_state"], 30) },
        { label: "Support CTA", quality: getContentQuality(settings["portal.support_cta"]) },
        { label: "Discord CTA", quality: getContentQuality(settings["portal.discord_cta"]) },
      ],
    }),
    area({
      id: "payments",
      label: "Payments",
      href: "/admin/production",
      checks: [
        { label: "Payment provider", quality: paymentReady ? "complete" : paymentMock ? "needs_review" : "missing" },
      ],
    }),
    area({
      id: "downloads",
      label: "Downloads",
      href: "/admin/downloads",
      checks: [
        { label: "Product files", quality: downloads > 0 ? "complete" : "missing" },
        { label: "Storage", quality: storageReady ? "complete" : "missing" },
      ],
    }),
  ];

  const completeAreas = areas.filter((item) => item.status === "Complete").length;
  const overallScore = Math.round(areas.reduce((total, item) => total + item.score, 0) / areas.length);
  const warnings = [
    contentMode === "demo" ? "Content mode is demo." : "",
    demoAnnouncementsPublic ? "Demo-like announcements are public." : "",
    settings["launch.secrets_rotated"] !== "true" ? "Secrets rotation has not been marked complete." : "",
  ].filter(Boolean);

  return {
    contentMode,
    overallScore,
    completeAreas,
    totalAreas: areas.length,
    areas,
    productReadiness,
    warnings,
    secretsRotated: settings["launch.secrets_rotated"] === "true",
    labels: {
      complete: qualityLabel("complete"),
      missing: qualityLabel("missing"),
      review: qualityLabel("needs_review"),
    },
  };
}
