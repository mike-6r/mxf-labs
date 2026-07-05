import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const asJson = (value) => JSON.stringify(value);

const obsoleteSlugs = ["ticket-plus", "licensegrid", "realm-ops", "addon-forge"];

const minecraftLicenseRules = [
  "One license belongs to one customer account.",
  "Default activation limit is three server instances unless manually adjusted.",
  "License validation may include server, device, Discord, IP, and version metadata.",
  "Suspicious activation changes can trigger manual review before access is restored.",
];

const infrastructureRules = [
  "Infrastructure APIs are internal MxF Labs platform systems.",
  "Access is reviewed manually and may require a scoped developer agreement.",
  "Requests are logged for security, rate-limit, and abuse-prevention review.",
];

const defaultDetailTabs = ["overview", "features", "showcase", "documentation", "licensing", "roadmap", "faq", "changelog"];
const defaultDetailSectionOrder = ["overview", "features", "showcase", "documentation", "licensing", "roadmap", "faq"];

const launchProducts = [
  {
    name: "MxF Factions",
    slug: "mxf-factions",
    category: "Minecraft Plugin",
    status: "In Development",
    price: "$20",
    priceCents: 2000,
    version: "1.0.0-dev",
    icon: "Swords",
    purchaseButtonText: "Join Waitlist",
    defaultActivationLimit: 3,
    shortDescription: "A competitive factions platform for serious Minecraft servers.",
    fullDescription:
      "MxF Factions is the flagship Minecraft product: a commercial-grade factions platform focused on GUI-led operations, war systems, outposts, analytics, seasonal progression, modular configuration, licensing, documentation, and long-term server ownership.",
    features: [
      "Competitive factions",
      "Advanced GUI system",
      "Outposts",
      "War Center",
      "Operations Center",
      "FTop / PTop",
      "Analytics",
      "Seasonal progression",
      "Premium YAML configuration",
      "Modular architecture",
      "Long-term support",
      "Commercial-grade performance",
    ],
    highlightedFeatures: [
      "War Center and Operations Center for server teams",
      "Advanced GUI-led faction management",
      "Seasonal progression, FTop, PTop, and analytics",
      "Premium YAML configuration and modular architecture",
      "Commercial-grade performance with long-term support",
    ],
    tags: ["Factions", "War Center", "Outposts", "GUI", "Analytics", "Paper"],
    featureIcons: ["Swords", "PanelTop", "ChartNoAxesCombined", "Settings2", "Gauge"],
    techStack: ["Java", "Paper", "YAML", "Prisma Licensing API", "Customer Portal"],
    screenshots: [],
    media: { cardImage: "", heroImage: "", mockupImage: "", featuredImage: "", galleryImages: [], galleryCaptions: [], showcaseImages: [], showcaseCaptions: [] },
    display: {
      layoutTemplate: "flagship",
      featured: true,
      featuredOrder: 1,
      showFeaturedSection: true,
      featuredLayoutStyle: "cinematic",
      cardStyle: "orbital",
      heroStyle: "constellation",
      accentColor: "#ff6262",
      badgeText: "Flagship",
      statusBadgeText: "In Development",
      showProgress: true,
      progressLabel: "Development progress",
      progressValue: 72,
      progressColor: "#ff7a7a",
      progressPlacement: "hero",
      showMockup: false,
      detailTabs: defaultDetailTabs,
      detailSectionOrder: defaultDetailSectionOrder,
      detailHiddenSections: [],
      detailSectionTitles: {
        overview: "A factions platform with operating discipline.",
        features: "Systems for competitive seasons.",
      },
      featurePaginationLimit: 8,
      featureCategories: [
        { title: "Core Gameplay", items: ["Competitive factions", "Advanced GUI system", "Premium YAML configuration", "Modular architecture"] },
        { title: "War Systems", items: ["Outposts", "War Center", "Operations Center", "FTop / PTop"] },
        { title: "Analytics", items: ["Analytics", "Seasonal progression", "Commercial-grade performance", "Long-term support"] },
      ],
    },
    buttons: [
      { label: "View Details", href: "/products/mxf-factions", style: "primary" },
      { label: "Join Waitlist", href: "/support?product=mxf-factions&intent=waitlist", style: "secondary" },
    ],
    seo: {
      title: "MxF Factions - Premium Minecraft Factions Platform",
      description: "MxF Factions is the flagship MxF Labs competitive factions platform for serious Minecraft servers.",
      image: "",
    },
    roadmap: [
      "Finalize core gameplay systems and war operations.",
      "Complete GUI, command, permission, and YAML documentation.",
      "Package release files behind secure customer downloads.",
      "Prepare onboarding and long-term support workflow.",
    ],
    faq: [
      "Is MxF Factions released? Not yet; it is in development and visible for launch preparation.",
      "How much will it cost? The planned launch price is $20.",
      "How many activations are included? The default activation limit is three server instances.",
    ],
    changelog: ["Launch product record seeded.", "Public product page connected to admin-managed content."],
    licenseRules: minecraftLicenseRules,
    documentationLink: "/docs?product=mxf-factions",
    supportLink: "/support?product=mxf-factions",
  },
  {
    name: "MxF Prisons",
    slug: "mxf-prisons",
    category: "Minecraft Plugin",
    status: "Planned",
    price: "$20",
    priceCents: 2000,
    version: "Roadmap",
    icon: "Pickaxe",
    purchaseButtonText: "Request Roadmap",
    defaultActivationLimit: 3,
    shortDescription: "A planned prison platform for modern progression-heavy Minecraft servers.",
    fullDescription:
      "MxF Prisons is planned as a premium commercial prison platform with deep mining progression, prestige economies, upgrade menus, gang competition, events, statistics, seasonal resets, and performance-conscious server operation.",
    features: [
      "Auto Reset Mines",
      "Mine Regions",
      "Rank Progression",
      "Prestige",
      "Rebirth",
      "Tokens",
      "Gems",
      "Crystals",
      "Pickaxe Enchantments",
      "Boss Mines",
      "Mining Events",
      "Battle Pass",
      "Daily Quests",
      "Gang System",
      "Token Shop",
      "Mining Statistics",
      "Upgrade Menus",
      "Seasonal Resets",
      "Leaderboards",
      "Performance Optimized",
    ],
    highlightedFeatures: [
      "Auto Reset Mines, regions, and boss mines",
      "Rank, prestige, rebirth, tokens, gems, and crystals",
      "Pickaxe enchantments, upgrade menus, quests, and battle pass",
      "Gang competition, seasonal resets, and leaderboards",
    ],
    tags: ["Prisons", "Progression", "Mines", "Tokens", "Prestige", "Roadmap"],
    featureIcons: ["Pickaxe", "Gem", "Trophy", "Hammer"],
    techStack: ["Java", "Paper", "Economy hooks", "Menu system", "Licensing API"],
    screenshots: [],
    media: { cardImage: "", heroImage: "", mockupImage: "", featuredImage: "", galleryImages: [], galleryCaptions: [], showcaseImages: [], showcaseCaptions: [] },
    display: {
      layoutTemplate: "coming-soon",
      featured: false,
      featuredOrder: 20,
      showFeaturedSection: true,
      featuredLayoutStyle: "editorial",
      cardStyle: "terminal",
      heroStyle: "terminal",
      accentColor: "#f7b955",
      badgeText: "Roadmap",
      statusBadgeText: "Planned",
      showProgress: true,
      progressLabel: "Specification progress",
      progressValue: 16,
      progressColor: "#f7b955",
      progressPlacement: "card",
      showMockup: false,
      detailTabs: defaultDetailTabs,
      detailSectionOrder: defaultDetailSectionOrder,
      detailHiddenSections: [],
      detailSectionTitles: {
        overview: "A roadmap for a modern prisons platform.",
        features: "Progression systems planned for launch.",
      },
      featurePaginationLimit: 8,
      featureCategories: [
        { title: "Mining Core", items: ["Auto Reset Mines", "Mine Regions", "Boss Mines", "Mining Events", "Performance Optimized"] },
        { title: "Progression", items: ["Rank Progression", "Prestige", "Rebirth", "Tokens", "Gems", "Crystals", "Pickaxe Enchantments"] },
        { title: "Competition", items: ["Battle Pass", "Daily Quests", "Gang System", "Token Shop", "Mining Statistics", "Upgrade Menus", "Seasonal Resets", "Leaderboards"] },
      ],
    },
    buttons: [
      { label: "View Roadmap", href: "/products/mxf-prisons", style: "primary" },
      { label: "Request Updates", href: "/support?product=mxf-prisons&intent=updates", style: "secondary" },
    ],
    seo: {
      title: "MxF Prisons - Planned Premium Prison Platform",
      description: "MxF Prisons is planned as a modern commercial prison platform for mining progression and seasonal competition.",
      image: "",
    },
    roadmap: ["Product specification", "Core mining systems", "Progression economy", "Season and leaderboard tooling"],
    faq: [
      "Has MxF Prisons been coded yet? No; it is planned and not yet released.",
      "What is the planned price? $20 for the launch product.",
    ],
    changelog: ["Launch roadmap record seeded."],
    licenseRules: minecraftLicenseRules,
    documentationLink: "/docs?product=mxf-prisons",
    supportLink: "/support?product=mxf-prisons",
  },
  {
    name: "MxF Skyblock",
    slug: "mxf-skyblock",
    category: "Minecraft Plugin",
    status: "Planned",
    price: "$20",
    priceCents: 2000,
    version: "Roadmap",
    icon: "Cloud",
    purchaseButtonText: "Request Roadmap",
    defaultActivationLimit: 3,
    shortDescription: "A planned commercial Skyblock platform for island growth and seasonal competition.",
    fullDescription:
      "MxF Skyblock is planned as a modern Skyblock platform with island progression, missions, minions, generators, economy systems, skills, farming progression, co-op, leaderboards, and seasonal island resets.",
    features: [
      "Island Creation",
      "Island Upgrades",
      "Island Levels",
      "Missions",
      "Challenges",
      "Minions",
      "Generators",
      "Island Economy",
      "Banking",
      "Permissions",
      "Resource Worlds",
      "Farming Progression",
      "Skills",
      "Custom Crops",
      "Automation",
      "Auction House",
      "Island Value",
      "Seasonal Islands",
      "Co-op",
      "Leaderboards",
    ],
    highlightedFeatures: [
      "Island creation, upgrades, levels, and value competition",
      "Missions, challenges, minions, generators, and automation",
      "Economy, banking, auction house, co-op, and permissions",
      "Seasonal islands, farming progression, skills, and leaderboards",
    ],
    tags: ["Skyblock", "Islands", "Minions", "Economy", "Seasons", "Roadmap"],
    featureIcons: ["Cloud", "Sprout", "Coins", "Users"],
    techStack: ["Java", "Paper", "Economy hooks", "Island data services", "Licensing API"],
    screenshots: [],
    media: { cardImage: "", heroImage: "", mockupImage: "", featuredImage: "", galleryImages: [], galleryCaptions: [], showcaseImages: [], showcaseCaptions: [] },
    display: {
      layoutTemplate: "coming-soon",
      featured: false,
      featuredOrder: 30,
      showFeaturedSection: true,
      featuredLayoutStyle: "split",
      cardStyle: "minimal",
      heroStyle: "stacked",
      accentColor: "#86efac",
      badgeText: "Roadmap",
      statusBadgeText: "Planned",
      showProgress: true,
      progressLabel: "Specification progress",
      progressValue: 14,
      progressColor: "#86efac",
      progressPlacement: "card",
      showMockup: false,
      detailTabs: defaultDetailTabs,
      detailSectionOrder: defaultDetailSectionOrder,
      detailHiddenSections: [],
      detailSectionTitles: {
        overview: "A roadmap for premium island progression.",
        features: "Island systems planned for the Skyblock product.",
      },
      featurePaginationLimit: 8,
      featureCategories: [
        { title: "Island Core", items: ["Island Creation", "Island Upgrades", "Island Levels", "Island Value", "Seasonal Islands", "Co-op", "Leaderboards"] },
        { title: "Progression", items: ["Missions", "Challenges", "Minions", "Generators", "Farming Progression", "Skills", "Custom Crops", "Automation"] },
        { title: "Economy", items: ["Island Economy", "Banking", "Permissions", "Resource Worlds", "Auction House"] },
      ],
    },
    buttons: [
      { label: "View Roadmap", href: "/products/mxf-skyblock", style: "primary" },
      { label: "Request Updates", href: "/support?product=mxf-skyblock&intent=updates", style: "secondary" },
    ],
    seo: {
      title: "MxF Skyblock - Planned Commercial Skyblock Platform",
      description: "MxF Skyblock is planned as a modern commercial Skyblock platform for islands, progression, economy, and seasons.",
      image: "",
    },
    roadmap: ["Product specification", "Island core", "Progression systems", "Seasonal competition"],
    faq: [
      "Has MxF Skyblock been coded yet? No; it is planned and not yet released.",
      "What is the planned price? $20 for the launch product.",
    ],
    changelog: ["Launch roadmap record seeded."],
    licenseRules: minecraftLicenseRules,
    documentationLink: "/docs?product=mxf-skyblock",
    supportLink: "/support?product=mxf-skyblock",
  },
  {
    name: "MxF AIO Bot",
    slug: "mxf-aio-bot",
    category: "Discord Product",
    status: "Active Development",
    price: "Free",
    priceCents: 0,
    version: "0.1.0",
    icon: "Bot",
    purchaseButtonText: "Discuss Setup",
    defaultActivationLimit: 1,
    shortDescription: "A modular all-in-one Discord platform for MxF communities and customer support.",
    fullDescription:
      "MxF AIO Bot is the single Discord product: a modular community platform for tickets, applications, moderation, verification, logging, automation, giveaways, leveling, suggestions, voice management, analytics, dashboards, and API integration.",
    features: [
      "Tickets",
      "Applications",
      "Moderation",
      "Verification",
      "Logging",
      "AutoMod",
      "Giveaways",
      "Leveling",
      "Reaction Roles",
      "Welcome",
      "Suggestions",
      "Polls",
      "Voice Management",
      "Temporary Channels",
      "Knowledge Base",
      "Staff Utilities",
      "Analytics",
      "Web Dashboard",
      "API Integration",
    ],
    highlightedFeatures: [
      "Tickets, applications, verification, moderation, and logging",
      "Giveaways, leveling, reaction roles, welcome flows, and suggestions",
      "Voice management, temporary channels, staff utilities, and analytics",
      "Web dashboard and API integration for the MxF ecosystem",
    ],
    tags: ["Discord", "Tickets", "Moderation", "Dashboard", "Automation", "Free"],
    featureIcons: ["Bot", "Ticket", "ShieldCheck", "ChartNoAxesCombined"],
    techStack: ["Discord.js", "TypeScript", "Prisma", "Website API", "Customer Portal"],
    screenshots: [],
    media: { cardImage: "", heroImage: "", mockupImage: "", featuredImage: "", galleryImages: [], galleryCaptions: [], showcaseImages: [], showcaseCaptions: [] },
    display: {
      layoutTemplate: "free",
      featured: false,
      featuredOrder: 40,
      showFeaturedSection: true,
      featuredLayoutStyle: "compact",
      cardStyle: "stacked",
      heroStyle: "terminal",
      accentColor: "#7dd3fc",
      badgeText: "Free",
      statusBadgeText: "Active Development",
      showProgress: true,
      progressLabel: "Module buildout",
      progressValue: 45,
      progressColor: "#7dd3fc",
      progressPlacement: "card",
      showMockup: false,
      detailTabs: defaultDetailTabs,
      detailSectionOrder: defaultDetailSectionOrder,
      detailHiddenSections: [],
      detailSectionTitles: {
        overview: "A modular Discord platform for MxF operations.",
        features: "Community modules without the clutter.",
      },
      featurePaginationLimit: 8,
      featureCategories: [
        { title: "Community Ops", items: ["Tickets", "Applications", "Verification", "Welcome", "Suggestions", "Polls", "Knowledge Base"] },
        { title: "Safety", items: ["Moderation", "Logging", "AutoMod", "Reaction Roles", "Staff Utilities"] },
        { title: "Growth", items: ["Giveaways", "Leveling", "Voice Management", "Temporary Channels", "Analytics", "Web Dashboard", "API Integration"] },
      ],
    },
    buttons: [
      { label: "View Modules", href: "/products/mxf-aio-bot", style: "primary" },
      { label: "Discuss Setup", href: "/support?product=mxf-aio-bot", style: "secondary" },
    ],
    seo: {
      title: "MxF AIO Bot - Modular Discord Platform",
      description: "MxF AIO Bot is a free modular all-in-one Discord platform for tickets, moderation, verification, support, and analytics.",
      image: "",
    },
    roadmap: ["Setup command polish", "Dashboard sync", "Role sync", "Knowledge base modules"],
    faq: [
      "Is MxF AIO Bot sold separately? No; it is currently free and supports the MxF ecosystem.",
      "Does ticket functionality live here? Yes; tickets are part of MxF AIO Bot.",
    ],
    changelog: ["Discord platform record seeded.", "Ticket and licensing ownership positioned under AIO Bot."],
    licenseRules: ["Free access is controlled by support and setup policy.", "Customer-linked modules may still require verified identity."],
    documentationLink: "/docs?product=mxf-aio-bot",
    supportLink: "/support?product=mxf-aio-bot",
  },
];

const infrastructureProducts = [
  ["Licensing API", "licensing-api", "License generation, activation, validation, resets, suspicious activity, and ownership checks."],
  ["Authentication API", "authentication-api", "Discord login, customer sessions, account linking, and admin/customer identity boundaries."],
  ["Customer API", "customer-api", "Customer records, product ownership, portal data, notifications, and support context."],
  ["Download API", "download-api", "Secure downloads, temporary signed tokens, ownership checks, license checks, and audit events."],
  ["Update API", "update-api", "Release metadata, changelog visibility, product versions, and future update-channel support."],
  ["Documentation API", "documentation-api", "Database-backed documentation records, product docs, visibility, ordering, and version metadata."],
  ["Telemetry API", "telemetry-api", "Product validation logs, product views, activity events, and suspicious activity review signals."],
].map(([name, slug, shortDescription]) => ({
  name,
  slug,
  category: "Infrastructure API",
  status: "Active Development",
  price: "Infrastructure",
  priceCents: 0,
  version: "0.1.0",
  icon: "Code2",
  purchaseButtonText: "Read Docs",
  defaultActivationLimit: 1,
  shortDescription,
  fullDescription: `${name} is an internal MxF Labs platform system that powers product delivery, customer operations, licensing, downloads, documentation, support, and future developer integrations.`,
  features: ["Admin managed", "Product ecosystem", "Secure workflow", "Developer-ready"],
  highlightedFeatures: ["Internal platform service", "Admin-managed records", "Provider-ready workflow"],
  tags: ["Infrastructure", "API", "Internal"],
  featureIcons: ["Code2", "ShieldCheck", "Database"],
  techStack: ["Next.js API", "Prisma", "SQLite local", "Provider adapters"],
  screenshots: [],
  media: { cardImage: "", heroImage: "", mockupImage: "", featuredImage: "", galleryImages: [], galleryCaptions: [], showcaseImages: [], showcaseCaptions: [] },
  display: {
    layoutTemplate: "infrastructure-api",
    featured: false,
    featuredOrder: 90,
    showFeaturedSection: false,
    featuredLayoutStyle: "compact",
    cardStyle: "minimal",
    heroStyle: "minimal",
    accentColor: "#a78bfa",
    badgeText: "Internal",
    statusBadgeText: "Active Development",
    showProgress: false,
    progressLabel: "",
    progressValue: 0,
    progressColor: "",
    progressPlacement: "hidden",
    showMockup: false,
    detailTabs: defaultDetailTabs,
    detailSectionOrder: defaultDetailSectionOrder,
    detailHiddenSections: ["showcase"],
    detailSectionTitles: {
      overview: "Internal platform infrastructure.",
      features: "Systems behind the product ecosystem.",
    },
    featurePaginationLimit: 6,
    featureCategories: [
      { title: "Platform", items: ["Admin managed", "Product ecosystem", "Secure workflow", "Developer-ready"] },
    ],
  },
  buttons: [{ label: "Read Docs", href: "/docs?product=platform", style: "secondary" }],
  seo: {
    title: `${name} - MxF Labs Platform Infrastructure`,
    description: `${name} is an internal MxF Labs infrastructure system powering the product ecosystem.`,
    image: "",
  },
  roadmap: ["Local mock support", "Provider configuration", "Production monitoring"],
  faq: [`Is ${name} customer software? No; it is infrastructure powering the MxF Labs ecosystem.`],
  changelog: [`${name} launch record seeded.`],
  licenseRules: infrastructureRules,
  documentationLink: "/docs?product=platform",
  supportLink: "/support",
}));

const launchProjects = [
  ["MxF Factions", "mxf-factions", "Minecraft Plugin", "In Development", "72%", "Core systems active", ["Java", "Paper", "YAML", "Licensing"]],
  ["MxF Prisons", "mxf-prisons", "Minecraft Plugin", "Planned", "16%", "Specification and product architecture", ["Java", "Paper", "Economy", "Menus"]],
  ["MxF Skyblock", "mxf-skyblock", "Minecraft Plugin", "Planned", "14%", "Specification and product architecture", ["Java", "Paper", "Islands", "Economy"]],
  ["MxF AIO Bot", "mxf-aio-bot", "Discord Bot", "Active Development", "45%", "Setup, support, and licensing modules", ["TypeScript", "Discord.js", "Prisma", "API"]],
  ["MxF Labs Website", "mxf-labs-website", "Website", "Release Candidate", "90%", "Production readiness and content sync", ["Next.js", "TypeScript", "Tailwind", "Prisma"]],
  ["MxF API Platform", "mxf-api-platform", "API", "Active Development", "62%", "Licensing, downloads, docs, customer portal", ["Next.js API", "Prisma", "SQLite", "Provider adapters"]],
];

const launchDocs = [
  {
    title: "MxF Factions Setup Overview",
    slug: "mxf-factions-setup-overview",
    productSlug: "mxf-factions",
    category: "Getting Started",
    excerpt: "Launch-track setup notes for installing, configuring, licensing, and supporting MxF Factions.",
    bodyMarkdown:
      "## Setup overview\n\nMxF Factions is in development. Before public checkout opens, the setup path is organized around installation, configuration, license validation, permissions, commands, and support handoff.\n\n### Launch checklist\n\n- Prepare a Paper server test environment.\n- Review modular YAML files before live rollout.\n- Validate license activation in a staging server.\n- Keep support tickets tied to the customer portal when reporting issues.",
  },
  {
    title: "MxF AIO Bot Setup Overview",
    slug: "mxf-aio-bot-setup-overview",
    productSlug: "mxf-aio-bot",
    category: "Getting Started",
    excerpt: "Setup notes for the official modular Discord companion system.",
    bodyMarkdown:
      "## Setup overview\n\nMxF AIO Bot powers support, setup, ticketing, license operations, moderation, and future dashboard workflows.\n\n### Modules\n\n- Tickets and support routing\n- Applications and staff utilities\n- License creation and lookup\n- Verification and role sync preparation\n- Logging, analytics, and website sync",
  },
  {
    title: "Licensing API Overview",
    slug: "licensing-api-overview",
    productSlug: "licensing-api",
    category: "API",
    excerpt: "How product runtimes should think about activation, validation, and ownership checks.",
    bodyMarkdown:
      "## Licensing API overview\n\nThe Licensing API powers generated keys, activations, validation, suspicious activity review, ownership checks, and customer portal state.\n\n### Core flow\n\n1. A paid or manual order creates a license.\n2. The product activates against a device and instance.\n3. Validation checks status, ownership, activation limits, and review flags.\n4. Suspicious changes are logged for admin review.",
  },
];

async function upsertProduct(product) {
  const productData = {
    name: product.name,
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    featuresJson: asJson(product.features || []),
    highlightedFeaturesJson: asJson(product.highlightedFeatures || []),
    tagsJson: asJson(product.tags || []),
    featureIconsJson: asJson(product.featureIcons || []),
    techStackJson: asJson(product.techStack || []),
    faqJson: asJson(product.faq || []),
    roadmapJson: asJson(product.roadmap || []),
    screenshotsJson: asJson(product.screenshots || []),
    licenseRulesJson: asJson(product.licenseRules || []),
    mediaJson: asJson(product.media || {}),
    displayJson: asJson(product.display || {}),
    buttonsJson: asJson(product.buttons || []),
    seoJson: asJson(product.seo || {}),
    price: product.price,
    priceCents: product.priceCents,
    currency: "USD",
    defaultActivationLimit: product.defaultActivationLimit,
    category: product.category,
    version: product.version,
    changelogJson: asJson(product.changelog || []),
    documentationLink: product.documentationLink,
    supportLink: product.supportLink,
    purchaseButtonText: product.purchaseButtonText,
    icon: product.icon,
    visible: true,
    status: product.status,
  };

  return prisma.product.upsert({
    where: { slug: product.slug },
    update: productData,
    create: {
      slug: product.slug,
      ...productData,
    },
  });
}

async function seedDownload(product) {
  const storageKey = "downloads/mxf-factions/1.0.0-dev/mxf-factions-launch-preview.zip";
  const target = path.join(process.cwd(), "storage", "products", storageKey);
  const body = [
    "MxF Factions launch preview artifact.",
    "This local file verifies ownership, licensing, tokenized downloads, and portal delivery before production files are uploaded.",
  ].join("\n");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body, "utf8");

  const release = await prisma.productRelease.upsert({
    where: { productId_version: { productId: product.id, version: "1.0.0-dev" } },
    update: {
      title: "Launch preview package",
      notes: "Local secure-download workflow package for final provider testing.",
      releaseType: "Preview",
      status: "Published",
      isLatest: true,
      publishedAt: new Date(),
    },
    create: {
      productId: product.id,
      version: "1.0.0-dev",
      title: "Launch preview package",
      notes: "Local secure-download workflow package for final provider testing.",
      releaseType: "Preview",
      status: "Published",
      isLatest: true,
      publishedAt: new Date(),
    },
  });

  await prisma.productDownload.upsert({
    where: { storageKey },
    update: {
      productId: product.id,
      releaseId: release.id,
      filename: "mxf-factions-launch-preview.zip",
      fileType: "ZIP",
      fileSize: Buffer.byteLength(body),
      version: "1.0.0-dev",
      visible: true,
      requiresLicense: true,
    },
    create: {
      productId: product.id,
      releaseId: release.id,
      filename: "mxf-factions-launch-preview.zip",
      fileType: "ZIP",
      storageKey,
      fileSize: Buffer.byteLength(body),
      version: "1.0.0-dev",
      visible: true,
      requiresLicense: true,
    },
  });
}

async function main() {
  await prisma.product.updateMany({
    where: { slug: { in: obsoleteSlugs } },
    data: { visible: false, status: "Archived", purchaseButtonText: "Archived" },
  });

  const products = [];
  for (const product of [...launchProducts, ...infrastructureProducts]) {
    products.push(await upsertProduct(product));
  }

  const productBySlug = new Map(products.map((product) => [product.slug, product]));
  await seedDownload(productBySlug.get("mxf-factions"));

  for (const [title, slug, category, status, completion, milestone, stack] of launchProjects) {
    await prisma.project.upsert({
      where: { slug },
      update: {
        title,
        category,
        description: `${title} is part of the MxF Labs launch ecosystem.`,
        techStackJson: asJson(stack),
        status,
        caseStudy: `Completion: ${completion}\nCurrent milestone: ${milestone}\nRoadmap stage: ${status}`,
        featured: slug === "mxf-factions" || slug === "mxf-labs-website",
        visible: true,
        previewLink: slug.startsWith("mxf-") ? `/products/${slug}` : null,
        repositoryLabel: "Private",
      },
      create: {
        title,
        slug,
        category,
        description: `${title} is part of the MxF Labs launch ecosystem.`,
        techStackJson: asJson(stack),
        status,
        caseStudy: `Completion: ${completion}\nCurrent milestone: ${milestone}\nRoadmap stage: ${status}`,
        featured: slug === "mxf-factions" || slug === "mxf-labs-website",
        visible: true,
        previewLink: slug.startsWith("mxf-") ? `/products/${slug}` : null,
        repositoryLabel: "Private",
      },
    });
  }

  for (const doc of launchDocs) {
    const product = productBySlug.get(doc.productSlug);
    await prisma.documentationArticle.upsert({
      where: { slug: doc.slug },
      update: {
        title: doc.title,
        category: doc.category,
        excerpt: doc.excerpt,
        bodyMarkdown: doc.bodyMarkdown,
        version: product?.version || "1.0.0",
        productId: product?.id || null,
        productVersion: product?.version || null,
        visible: true,
        sortOrder: 10,
      },
      create: {
        title: doc.title,
        slug: doc.slug,
        category: doc.category,
        excerpt: doc.excerpt,
        bodyMarkdown: doc.bodyMarkdown,
        version: product?.version || "1.0.0",
        productId: product?.id || null,
        productVersion: product?.version || null,
        visible: true,
        sortOrder: 10,
      },
    });
  }

  const settings = [
    ["products.featured_slug", "mxf-factions", "Featured product slug for public storefront ordering."],
    ["home.featured_product", "mxf-factions", "Homepage featured product slug."],
    ["footer.products", "MxF Factions|/products/mxf-factions\nMxF Prisons|/products#mxf-prisons\nMxF Skyblock|/products#mxf-skyblock\nMxF AIO Bot|/products#mxf-aio-bot\nInfrastructure|/products#infrastructure", "Footer product quick links."],
    ["nav.enabled_items", "Products,Docs,Projects,Support", "Visible public navigation items."],
    ["platform.content_mode", "clean", "Default launch-prep content mode."],
  ];

  for (const [key, value, description] of settings) {
    await prisma.platformSetting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        products: products.map((product) => product.slug),
        projects: launchProjects.map((project) => project[1]),
        docs: launchDocs.map((doc) => doc.slug),
        archivedObsoleteProducts: obsoleteSlugs,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
