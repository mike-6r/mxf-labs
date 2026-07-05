import { z } from "zod";
import { splitList } from "@/lib/db/serializers";
import { PRODUCT_STATUS_OPTIONS } from "@/lib/products/status";

const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a URL-safe slug.");

const listSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return splitList(value);
  }

  return [];
}, z.array(z.string().min(1)).default([]));

const productLinkSchema = z
  .string()
  .trim()
  .refine((value) => !value || value.startsWith("/") || z.string().url().safeParse(value).success, "Use a URL or internal path.")
  .optional()
  .or(z.literal(""));

const productMediaPathSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    if (!value) return true;
    if (z.string().url().safeParse(value).success) return true;
    return value.startsWith("/") && !value.includes("..") && !value.includes("\\");
  }, "Use a safe internal media path or URL.")
  .optional()
  .or(z.literal(""));

const productButtonSchema = z.object({
  label: z.string().trim().min(1).max(80),
  href: productLinkSchema.default(""),
  style: z.enum(["primary", "secondary", "ghost"]).default("secondary"),
});

const productSectionTitlesSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [String(key).trim(), String(item || "").trim()])
      .filter(([key, item]) => key && item),
  );
}, z.record(z.string(), z.string().trim().max(120)).default({}));

const productFeatureCategorySchema = z.object({
  title: z.string().trim().min(1).max(80),
  items: listSchema,
});

const productMediaSchema = z.object({
  cardImage: productMediaPathSchema,
  heroImage: productMediaPathSchema,
  mockupImage: productMediaPathSchema,
  featuredImage: productMediaPathSchema,
  galleryImages: listSchema,
  galleryCaptions: listSchema,
  showcaseImages: listSchema,
  showcaseCaptions: listSchema,
});

const productDisplaySchema = z.object({
  layoutTemplate: z.enum(["flagship", "compact", "coming-soon", "free", "infrastructure-api"]).default("compact"),
  featured: z.boolean().default(false),
  featuredOrder: z.coerce.number().int().min(0).max(9999).default(0),
  showFeaturedSection: z.boolean().default(true),
  featuredLayoutStyle: z.enum(["cinematic", "split", "editorial", "compact"]).default("cinematic"),
  cardStyle: z.enum(["orbital", "minimal", "terminal", "stacked"]).default("orbital"),
  heroStyle: z.enum(["constellation", "minimal", "terminal", "stacked", "image"]).default("constellation"),
  accentColor: z.string().trim().max(40).default("#ff6262"),
  badgeText: z.string().trim().max(80).default(""),
  statusBadgeText: z.string().trim().max(80).default(""),
  showProgress: z.boolean().default(false),
  progressLabel: z.string().trim().max(80).default(""),
  progressValue: z.coerce.number().min(0).max(100).default(0),
  progressColor: z.string().trim().max(40).default(""),
  progressPlacement: z.enum(["card", "hero", "detail", "hidden"]).default("card"),
  showMockup: z.boolean().default(false),
  detailTabs: listSchema.default(["overview", "features", "showcase", "documentation", "licensing", "roadmap", "faq", "changelog"]),
  detailSectionOrder: listSchema.default(["overview", "features", "showcase", "documentation", "licensing", "roadmap", "faq"]),
  detailHiddenSections: listSchema.default([]),
  detailSectionTitles: productSectionTitlesSchema,
  featureCategories: z.array(productFeatureCategorySchema).default([]),
  featurePaginationLimit: z.coerce.number().int().min(1).max(30).default(8),
});

const productSeoSchema = z.object({
  title: z.string().trim().max(120).default(""),
  description: z.string().trim().max(220).default(""),
  image: productMediaPathSchema,
});

export const productSchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugSchema,
  shortDescription: z.string().min(8).max(220),
  fullDescription: z.string().max(2000).default(""),
  features: listSchema,
  highlightedFeatures: listSchema,
  tags: listSchema,
  featureIcons: listSchema,
  techStack: listSchema,
  faq: listSchema,
  roadmap: listSchema,
  screenshots: listSchema,
  licenseRules: listSchema,
  media: productMediaSchema.default({
    cardImage: "",
    heroImage: "",
    mockupImage: "",
    featuredImage: "",
    galleryImages: [],
    galleryCaptions: [],
    showcaseImages: [],
    showcaseCaptions: [],
  }),
  display: productDisplaySchema.default({
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
  }),
  buttons: z.array(productButtonSchema).default([]),
  seo: productSeoSchema.default({ title: "", description: "", image: "" }),
  price: z.string().min(1).max(80).default("Contact for pricing"),
  priceCents: z.coerce.number().int().min(0).max(100_000_000).default(0),
  currency: z.string().trim().min(3).max(3).default("USD"),
  defaultActivationLimit: z.coerce.number().int().min(1).max(999).default(3),
  category: z.string().min(1).max(80).default("Product"),
  version: z.string().min(1).max(40).default("0.1.0"),
  changelog: listSchema,
  documentationLink: productLinkSchema,
  supportLink: productLinkSchema,
  purchaseButtonText: z.string().min(1).max(80).default("Learn More"),
  icon: z.string().min(1).max(60).default("PackageCheck"),
  visible: z.boolean().default(true),
  status: z.enum(PRODUCT_STATUS_OPTIONS).default("Coming Soon"),
});

export const projectSchema = z.object({
  title: z.string().min(2).max(120),
  slug: slugSchema,
  category: z.enum(["Website", "Discord Bot", "Minecraft Plugin", "Web Panel", "API", "Product"]),
  description: z.string().min(8).max(260),
  techStack: listSchema,
  status: z.string().min(1).max(80).default("Concept"),
  previewLink: z.string().url().optional().or(z.literal("")),
  repositoryLabel: z.string().max(120).optional().or(z.literal("")),
  caseStudy: z.string().max(5000).default(""),
  featured: z.boolean().default(false),
  visible: z.boolean().default(true),
});

export const announcementSchema = z.object({
  title: z.string().min(2).max(140),
  body: z.string().min(6).max(800),
  type: z.enum(["Update", "Maintenance", "Release", "Alert", "General"]).default("General"),
  visibility: z.enum(["Public", "Admin only", "Product customers only later"]).default("Public"),
  pinned: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const publicSupportSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  discordUsername: z.string().max(80).optional().or(z.literal("")),
  relatedProductId: z.string().optional().or(z.literal("")),
  relatedLicenseId: z.string().optional().or(z.literal("")),
  priority: z.enum(["Low", "Normal", "High", "Urgent"]).default("Normal"),
  subject: z.string().min(4).max(160),
  message: z.string().min(10).max(4000),
  attachmentName: z.string().max(180).optional().or(z.literal("")),
});

export const publicContactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  service: z.string().min(2).max(120),
  budget: z.string().min(2).max(80),
  description: z.string().min(10).max(4000),
});

export const supportTicketUpdateSchema = z.object({
  status: z.enum(["Open", "Waiting", "In Progress", "Waiting on Customer", "Resolved", "Closed"]).optional(),
  priority: z.enum(["Low", "Normal", "High", "Urgent"]).optional(),
  internalNotes: z.string().max(4000).optional(),
  note: z.string().max(2000).optional(),
});

export const contactUpdateSchema = z.object({
  status: z.enum(["Unread", "Read", "Archived"]).optional(),
  notes: z.string().max(4000).optional(),
  leadStage: z.string().max(80).optional(),
});

export const licenseCreateSchema = z.object({
  productId: z.string().optional().or(z.literal("")),
  customerId: z.string().optional().or(z.literal("")),
  expirationDate: z.string().optional().or(z.literal("")),
  maxActivations: z.coerce.number().int().min(1).max(999).default(1),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const licenseUpdateSchema = z.object({
  status: z.enum(["Active", "Suspended", "Expired", "Revoked"]).optional(),
  blacklisted: z.boolean().optional(),
  licenseType: z.enum(["Permanent", "Monthly", "Yearly", "Lifetime", "Trial", "Custom"]).optional(),
  maxActivations: z.coerce.number().int().min(1).max(999).optional(),
  currentActivations: z.coerce.number().int().min(0).max(999).optional(),
  notes: z.string().max(2000).optional(),
});

export const orderCreateSchema = z.object({
  customerId: z.string().optional().or(z.literal("")),
  productId: z.string().optional().or(z.literal("")),
  status: z.enum(["Pending", "Paid", "Fulfilled", "Refunded", "Failed", "Canceled"]).default("Pending"),
  amountCents: z.coerce.number().int().min(0).max(100_000_000).default(0),
  taxCents: z.coerce.number().int().min(0).max(100_000_000).default(0),
  currency: z.string().trim().min(3).max(3).default("USD"),
  purchaseIntentId: z.string().max(180).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const orderUpdateSchema = orderCreateSchema.partial();

export const licenseValidationSchema = z.object({
  key: z.string().min(8).max(120),
  productSlug: z.string().optional(),
  productVersion: z.string().max(80).optional(),
  deviceId: z.string().max(180).optional(),
  instanceId: z.string().max(180).optional(),
  activationId: z.string().max(180).optional(),
  discordId: z.string().max(80).optional(),
});

export const licenseActivationSchema = z.object({
  key: z.string().min(8).max(120),
  productSlug: z.string().optional(),
  productVersion: z.string().max(80).optional(),
  deviceId: z.string().min(2).max(180),
  instanceId: z.string().min(2).max(180),
  discordId: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
});

export const licenseDeactivationSchema = z.object({
  key: z.string().min(8).max(120),
  deviceId: z.string().min(2).max(180),
  instanceId: z.string().min(2).max(180),
});

export const checkoutSchema = z.object({
  productSlug: z.string().min(2).max(80),
  customerEmail: z.string().email().optional(),
  customerName: z.string().min(2).max(120).optional(),
  couponCode: z.string().max(80).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const botCustomerSchema = z.object({
  discordId: z.string().min(2).max(80),
  username: z.string().min(1).max(120),
  globalName: z.string().max(120).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
});

export const botServerSchema = z.object({
  serverId: z.string().min(2).max(80),
  serverName: z.string().min(1).max(160),
  ownerDiscordId: z.string().min(2).max(80),
  customerDiscordId: z.string().max(80).optional(),
  licenseKey: z.string().max(120).optional(),
  productSlug: z.string().max(80).optional(),
});

export const botLicenseSchema = z.object({
  key: z.string().min(8).max(120),
  discordId: z.string().max(80).optional(),
  productSlug: z.string().max(80).optional(),
});

export const botProductSchema = z.object({
  slug: z.string().min(2).max(80),
});
