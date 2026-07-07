import { createHash } from "node:crypto";
import { getContentMode } from "@/lib/content-mode";
import { prisma } from "@/lib/db/prisma";
import { getSettings } from "@/lib/db/settings";
import { getSetupStatus } from "@/lib/setup/status";

export type ProductionEnvStatus = "configured" | "missing" | "optional";

export type ProductionEnvItem = {
  key: string;
  label: string;
  required: boolean;
  status: ProductionEnvStatus;
  powers: string;
};

export type SecretRotationWarning = {
  id: string;
  label: string;
  severity: "warning" | "critical";
  detail: string;
};

export type DeploymentReadinessItem = {
  id: string;
  label: string;
  status: "ready" | "warning" | "blocked";
  detail: string;
};

const envItems: Array<Omit<ProductionEnvItem, "status">> = [
  { key: "CONTENT_MODE", label: "Content mode", required: true, powers: "Production-only public content filtering" },
  { key: "NEXT_PUBLIC_SITE_URL", label: "Site URL", required: true, powers: "Canonical URLs, redirects, sitemap, bot links" },
  { key: "DATABASE_URL", label: "Database URL", required: true, powers: "Persistent platform data" },
  { key: "AUTH_SECRET", label: "Auth secret", required: true, powers: "Admin/customer session signing" },
  { key: "MOCK_PROVIDERS_ENABLED", label: "Mock provider flag", required: true, powers: "Production safety guard for demo providers" },
  { key: "PAYMENT_PROVIDER_MODE", label: "Payment provider mode", required: true, powers: "Checkout provider routing" },
  { key: "DISCORD_CLIENT_ID", label: "Discord client ID", required: true, powers: "Discord OAuth and bot registration" },
  { key: "DISCORD_CLIENT_SECRET", label: "Discord client secret", required: true, powers: "Discord OAuth callback exchange" },
  { key: "DISCORD_PUBLIC_KEY", label: "Discord public key", required: true, powers: "Interaction verification readiness" },
  { key: "DISCORD_REDIRECT_URI", label: "Discord redirect URI", required: true, powers: "Discord OAuth redirects" },
  { key: "DISCORD_BOT_TOKEN", label: "Discord bot token", required: true, powers: "Live bot connection" },
  { key: "DISCORD_BOT_API_KEY", label: "Discord bot API key", required: true, powers: "Protected website sync" },
  { key: "MXF_API_BASE_URL", label: "Bot API base URL", required: true, powers: "Bot-to-website API calls" },
  { key: "MXF_BOT_API_KEY", label: "Bot website API key", required: true, powers: "Protected bot-to-website requests" },
  { key: "BOT_LOCAL_MODE", label: "Bot local mode flag", required: true, powers: "Live bot safety mode" },
  { key: "PAYPAL_CLIENT_ID", label: "PayPal client ID", required: true, powers: "PayPal checkout" },
  { key: "PAYPAL_CLIENT_SECRET", label: "PayPal client secret", required: true, powers: "PayPal API auth" },
  { key: "PAYPAL_WEBHOOK_ID", label: "PayPal webhook ID", required: true, powers: "PayPal webhook verification" },
  { key: "PAYPAL_ENV", label: "PayPal environment", required: true, powers: "PayPal sandbox/live routing" },
  { key: "STRIPE_SECRET_KEY", label: "Stripe secret key", required: true, powers: "Stripe checkout/session fulfillment" },
  { key: "STRIPE_PUBLISHABLE_KEY", label: "Stripe publishable key", required: true, powers: "Stripe client checkout readiness" },
  { key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", label: "Public Stripe key", required: true, powers: "Client Stripe publishable key" },
  { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe webhook secret", required: true, powers: "Stripe webhook verification" },
  { key: "RESEND_API_KEY", label: "Resend API key", required: true, powers: "Transactional email sending" },
  { key: "FROM_EMAIL", label: "From email", required: true, powers: "Transactional email sender" },
  { key: "SUPPORT_EMAIL", label: "Support email", required: true, powers: "Support/contact routing" },
  { key: "STORAGE_PROVIDER", label: "Storage provider", required: true, powers: "Product file storage" },
  { key: "LOCAL_STORAGE_ROOT", label: "Local storage root", required: true, powers: "Local private downloads" },
  { key: "IONOS_DEPLOY_TARGET", label: "IONOS deploy target", required: false, powers: "Operator note for VPS/Node runtime readiness" },
  { key: "CONTACT_TO_EMAIL", label: "Contact destination", required: false, powers: "Contact form routing override" },
  { key: "DISCORD_WEBHOOK_URL", label: "Discord webhook URL", required: false, powers: "Discord notification routing" },
  { key: "GITHUB_URL", label: "GitHub URL", required: false, powers: "Optional footer/social link" },
  { key: "DISCORD_INVITE_URL", label: "Discord invite URL", required: false, powers: "Optional community CTA" },
];

const knownDefaultAuthSecretHashes = new Set(["523fa353f8cc1e761da06107e02388a569cc450a495ce7147510999cc5916a96"]);

function envValue(key: string) {
  return process.env[key]?.trim() || "";
}

function hasEnv(key: string) {
  const value = envValue(key);
  return Boolean(value && !/replace|changeme|placeholder|your-/i.test(value));
}

function isProbablyDevSecret(value: string) {
  return /changeme|replace|placeholder|development|dev-secret|local-secret|test-secret/i.test(value);
}

function isKnownDefaultAuthSecret(value: string) {
  if (!value) return false;
  return knownDefaultAuthSecretHashes.has(createHash("sha256").update(value).digest("hex"));
}

function isLocalUrl(value: string) {
  return /(^|\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(value);
}

function isPostgresUrl(value: string) {
  return /^postgres(ql)?:\/\//i.test(value);
}

function hasProductionLegalCopy(value = "", minLength: number) {
  return value.trim().length >= minLength && !/managed from the admin|reviewed manually|placeholder|lorem/i.test(value);
}

function parseMediaImages(value: string) {
  try {
    const media = JSON.parse(value || "{}") as Record<string, unknown>;
    return ["galleryImages", "showcaseImages"].reduce((total, key) => {
      const list = media[key];
      return total + (Array.isArray(list) ? list.filter((item) => typeof item === "string" && item.trim()).length : 0);
    }, 0);
  } catch {
    return 0;
  }
}

function warning(id: string, label: string, detail: string, severity: SecretRotationWarning["severity"] = "warning"): SecretRotationWarning {
  return { id, label, detail, severity };
}

export async function getProductionReadiness() {
  const [setup, contentMode, settings, demoCounts, products, twoFactorEnabledCount] = await Promise.all([
    getSetupStatus(),
    getContentMode(),
    getSettings(["legal.terms", "legal.privacy", "legal.refunds"]),
    Promise.all([
      prisma.customer.count({ where: { OR: [{ email: { contains: "test" } }, { email: { contains: "mock" } }, { email: { contains: "flow" } }] } }),
      prisma.announcement.count({ where: { active: true, visibility: "Public", OR: [{ title: { contains: "demo" } }, { body: { contains: "demo" } }, { body: { contains: "placeholder" } }] } }),
      prisma.documentationArticle.count({ where: { visible: true, OR: [{ title: { contains: "demo" } }, { bodyMarkdown: { contains: "placeholder" } }] } }),
    ]),
    prisma.product.findMany({
      where: { visible: true },
      include: {
        _count: {
          select: {
            documentation: true,
            downloads: true,
            releases: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.platformSetting.count({
      where: {
        key: { startsWith: "security.admin_2fa." },
        value: { contains: "\"enabled\":true" },
      },
    }),
  ]);

  const env = envItems.map((item): ProductionEnvItem => ({
    ...item,
    status: hasEnv(item.key) ? "configured" : item.required ? "missing" : "optional",
  }));

  const warnings: SecretRotationWarning[] = [];
  const authSecret = envValue("AUTH_SECRET");
  const stripeSecret = envValue("STRIPE_SECRET_KEY");
  const stripePublishable = envValue("STRIPE_PUBLISHABLE_KEY");
  const paypalEnv = envValue("PAYPAL_ENV");
  const databaseUrl = envValue("DATABASE_URL");
  const siteUrl = envValue("NEXT_PUBLIC_SITE_URL");
  const localUrlWarnings = ["NEXT_PUBLIC_SITE_URL", "DISCORD_REDIRECT_URI", "MXF_API_BASE_URL"].filter((key) => isLocalUrl(envValue(key)));

  if (!authSecret || isProbablyDevSecret(authSecret) || isKnownDefaultAuthSecret(authSecret)) {
    warnings.push({
      id: "auth-secret",
      label: "Rotate AUTH_SECRET",
      severity: "critical",
      detail: "Use a fresh production-only secret before launch. Placeholder, shared, or default secrets are not safe for live sessions.",
    });
  }

  if (envValue("MOCK_PROVIDERS_ENABLED") === "true" || envValue("PAYMENT_PROVIDER_MODE") === "mock") {
    warnings.push({
      id: "mock-providers",
      label: "Mock providers enabled",
      severity: "critical",
      detail: "Disable mock providers before live checkout testing.",
    });
  }

  if (envValue("BOT_LOCAL_MODE") === "true") {
    warnings.push({
      id: "bot-local",
      label: "Discord bot local mode",
      severity: "warning",
      detail: "Turn off local mode for the live bot deployment.",
    });
  }

  if (contentMode !== "production") {
    warnings.push({
      id: "content-mode",
      label: "Production content mode is not active",
      severity: "critical",
      detail: "Set CONTENT_MODE=production for the live environment so demo/test surfaces stay hidden.",
    });
  }

  if (localUrlWarnings.length) {
    warnings.push({
      id: "localhost-urls",
      label: "Localhost URLs configured",
      severity: "critical",
      detail: `${localUrlWarnings.join(", ")} still point at a local development address.`,
    });
  }

  if (stripeSecret.startsWith("sk_test") || stripePublishable.startsWith("pk_test")) {
    warnings.push({
      id: "stripe-test",
      label: "Stripe test keys",
      severity: "warning",
      detail: "Use live keys only after final sandbox testing is complete.",
    });
  }

  if (paypalEnv === "sandbox") {
    warnings.push({
      id: "paypal-sandbox",
      label: "PayPal sandbox mode",
      severity: "warning",
      detail: "Switch PayPal to live mode for production checkout.",
    });
  }

  for (const key of ["STRIPE_WEBHOOK_SECRET", "PAYPAL_WEBHOOK_ID", "RESEND_API_KEY"]) {
    if (!hasEnv(key)) {
      warnings.push({
        id: key.toLowerCase(),
        label: `${key} missing`,
        severity: "critical",
        detail: "Provider testing cannot be final without this value.",
      });
    }
  }

  for (const key of ["DISCORD_CLIENT_SECRET", "DISCORD_BOT_TOKEN", "DISCORD_BOT_API_KEY", "PAYPAL_CLIENT_SECRET", "STRIPE_SECRET_KEY"]) {
    const value = envValue(key);
    if (value && isProbablyDevSecret(value)) {
      warnings.push({
        id: `${key.toLowerCase()}-placeholder`,
        label: `${key} looks like a placeholder`,
        severity: "critical",
        detail: "Replace placeholder secrets with provider-generated production values.",
      });
    }
  }

  warnings.push({
    id: "shared-secrets",
    label: "Rotate any shared credentials",
    severity: "warning",
    detail: "Any credential pasted into chat, tickets, screenshots, or local notes should be regenerated before launch.",
  });

  const contentModeWarnings = [
    contentMode === "demo" ? "CONTENT_MODE is demo." : "",
    demoCounts[0] > 0 ? `${demoCounts[0]} demo-like customers exist.` : "",
    demoCounts[1] > 0 ? `${demoCounts[1]} demo-like public announcements exist.` : "",
    demoCounts[2] > 0 ? `${demoCounts[2]} demo-like docs are published.` : "",
  ].filter(Boolean);

  const storefrontProducts = products.filter((product) => !/infrastructure|api/i.test(`${product.category} ${product.name}`));
  const missingScreenshots = storefrontProducts.filter((product) => parseMediaImages(product.mediaJson) === 0);
  const missingDocs = storefrontProducts.filter((product) => !product.documentationLink && product._count.documentation === 0);
  const missingReleaseFiles = storefrontProducts.filter((product) => product._count.downloads === 0);
  const missingReleases = storefrontProducts.filter((product) => product._count.releases === 0);
  const missingLegalCopy = [
    !hasProductionLegalCopy(settings["legal.terms"], 80) ? "Terms" : "",
    !hasProductionLegalCopy(settings["legal.privacy"], 80) ? "Privacy" : "",
    !hasProductionLegalCopy(settings["legal.refunds"], 40) ? "Refunds" : "",
  ].filter(Boolean);
  const setupLevel = (id: string) => setup.statuses.find((item) => item.id === id)?.level;
  const missingWebhookValues = [
    !hasEnv("STRIPE_WEBHOOK_SECRET") ? "STRIPE_WEBHOOK_SECRET" : "",
    !hasEnv("PAYPAL_WEBHOOK_ID") ? "PAYPAL_WEBHOOK_ID" : "",
    !hasEnv("DISCORD_WEBHOOK_URL") ? "DISCORD_WEBHOOK_URL" : "",
  ].filter(Boolean);

  const productionDataWarnings: SecretRotationWarning[] = [
    missingScreenshots.length
      ? warning("product-screenshots", "Missing product screenshots/showcase", `${missingScreenshots.map((product) => product.name).slice(0, 5).join(", ")} need gallery or showcase media before launch.`)
      : null,
    missingDocs.length
      ? warning("product-docs", "Missing product documentation", `${missingDocs.map((product) => product.name).slice(0, 5).join(", ")} need docs links or admin documentation articles.`)
      : null,
    missingReleaseFiles.length
      ? warning("release-files", "Missing release/download files", `${missingReleaseFiles.map((product) => product.name).slice(0, 5).join(", ")} have no visible product download files.`)
      : null,
    missingReleases.length
      ? warning("release-records", "Missing release records", `${missingReleases.map((product) => product.name).slice(0, 5).join(", ")} have no release records/changelog-backed release entries.`)
      : null,
    setupLevel("stripe") !== "ready"
      ? warning("stripe-config", "Stripe config incomplete", "Stripe checkout is not production-ready until secret, publishable, and webhook values are present.", "critical")
      : null,
    setupLevel("paypal") !== "ready"
      ? warning("paypal-config", "PayPal config incomplete", "PayPal checkout is not production-ready until client, secret, and webhook ID values are present.", "critical")
      : null,
    setupLevel("resend") !== "ready"
      ? warning("resend-config", "Resend config missing", "Transactional email will remain local/logged until RESEND_API_KEY and sender values are configured.", "critical")
      : null,
    !isPostgresUrl(databaseUrl)
      ? warning("production-database", "Production database missing", "SQLite is fine locally, but launch should use a production database such as PostgreSQL.", "critical")
      : null,
    missingLegalCopy.length
      ? warning("legal-copy", "Missing legal copy", `${missingLegalCopy.join(", ")} policy copy still needs production-ready admin content.`, "critical")
      : null,
    missingWebhookValues.length
      ? warning("webhook-values", "Webhook config missing", `${missingWebhookValues.join(", ")} still need production provider values.`)
      : null,
    twoFactorEnabledCount === 0
      ? warning("admin-2fa", "Admin 2FA is not enabled", "Enable two-factor authentication from /admin/settings before launch.", "critical")
      : null,
  ].filter((item): item is SecretRotationWarning => Boolean(item));

  const ionosDeployTarget = envValue("IONOS_DEPLOY_TARGET").toLowerCase();
  const storagePath = envValue("LOCAL_STORAGE_ROOT");
  const ionosReadiness: DeploymentReadinessItem[] = [
    {
      id: "ionos-static",
      label: "IONOS static/shared hosting",
      status: "blocked",
      detail: "Static hosting is not enough for this platform because it uses Next.js API routes, SSR/RSC, Prisma, private downloads, webhooks, and a long-running Discord bot.",
    },
    {
      id: "ionos-node",
      label: "IONOS VPS or Node server",
      status: /vps|cloud|node|server/.test(ionosDeployTarget) ? "ready" : "warning",
      detail: /vps|cloud|node|server/.test(ionosDeployTarget)
        ? "Deployment target is marked as a Node-capable IONOS server."
        : "Use IONOS VPS/Cloud Server or another Node-capable host. Set IONOS_DEPLOY_TARGET=vps after the server plan is selected.",
    },
    {
      id: "domain",
      label: "Domain URL",
      status: siteUrl.startsWith("https://") && !isLocalUrl(siteUrl) ? "ready" : "blocked",
      detail: siteUrl.startsWith("https://") && !isLocalUrl(siteUrl) ? `Public URL is ${siteUrl}.` : "Set NEXT_PUBLIC_SITE_URL=https://mxf-labs.com.",
    },
    {
      id: "postgres",
      label: "Production database",
      status: isPostgresUrl(databaseUrl) ? "ready" : "blocked",
      detail: isPostgresUrl(databaseUrl) ? "DATABASE_URL is using PostgreSQL." : "Set DATABASE_URL to a PostgreSQL connection string before deployment.",
    },
    {
      id: "storage",
      label: "Private storage/downloads",
      status: setupLevel("local-storage") === "ready" && storagePath && !/public[\\/]/i.test(storagePath) ? "ready" : "warning",
      detail: storagePath && !/public[\\/]/i.test(storagePath)
        ? `Local storage path is configured as ${storagePath}.`
        : "Set LOCAL_STORAGE_ROOT to a private server path outside /public.",
    },
    {
      id: "payments",
      label: "Payments",
      status: setupLevel("stripe") === "ready" && setupLevel("paypal") === "ready" && envValue("PAYMENT_PROVIDER_MODE") !== "mock" ? "ready" : "warning",
      detail: "Stripe and PayPal need live/sandbox-final credentials, webhook secrets, and mock mode disabled before live checkout.",
    },
    {
      id: "email",
      label: "Email",
      status: setupLevel("resend") === "ready" ? "ready" : "warning",
      detail: setupLevel("resend") === "ready" ? "Resend credentials and sender values are configured." : "Add RESEND_API_KEY and verified sender emails.",
    },
    {
      id: "discord-bot",
      label: "Discord bot",
      status: setupLevel("discord-bot") === "ready" && envValue("BOT_LOCAL_MODE") !== "true" ? "ready" : "warning",
      detail: "Run the bot as a managed Node process with MXF_API_BASE_URL pointed at the live website.",
    },
    {
      id: "content-mode",
      label: "Production content mode",
      status: contentMode === "production" ? "ready" : "warning",
      detail: contentMode === "production" ? "Production content filtering is active." : "Set CONTENT_MODE=production on the live server.",
    },
    {
      id: "abuse-controls",
      label: "Abuse controls",
      status: "ready",
      detail: "Public forms, search, admin login, and license runtime APIs use shared rate limits with retry headers. Browser security headers are applied globally by Next.js.",
    },
  ];

  const requiredConfigured = env.filter((item) => item.required && item.status === "configured").length;
  const requiredTotal = env.filter((item) => item.required).length;

  return {
    env,
    warnings,
    setup,
    contentMode,
    contentModeWarnings,
    productionDataWarnings,
    ionosReadiness,
    requiredConfigured,
    requiredTotal,
    score: Math.round((requiredConfigured / requiredTotal) * 100),
  };
}
