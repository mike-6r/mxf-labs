import fs from "node:fs/promises";
import { prisma } from "@/lib/db/prisma";
import { resolveLocalStorageRoot } from "@/lib/storage/local";

export type SetupStatusLevel = "ready" | "mock" | "missing" | "warning";

export type SetupStatusItem = {
  id: string;
  label: string;
  level: SetupStatusLevel;
  summary: string;
  env: string[];
  powers: string[];
  nextStep: string;
};

function hasEnv(key: string) {
  const value = process.env[key]?.trim();
  return Boolean(value && value !== "replace-with-a-private-bot-api-key");
}

function hasAny(keys: string[]) {
  return keys.some(hasEnv);
}

function hasAll(keys: string[]) {
  return keys.every(hasEnv);
}

function mockEnabled() {
  return process.env.MOCK_PROVIDERS_ENABLED === "true" || process.env.PAYMENT_PROVIDER_MODE === "mock";
}

function item({
  id,
  label,
  env,
  powers,
  nextStep,
  ready,
  mock,
  readySummary,
  mockSummary,
  missingSummary,
}: {
  id: string;
  label: string;
  env: string[];
  powers: string[];
  nextStep: string;
  ready: boolean;
  mock?: boolean;
  readySummary: string;
  mockSummary?: string;
  missingSummary: string;
}): SetupStatusItem {
  if (ready) {
    return { id, label, level: "ready", summary: readySummary, env, powers, nextStep: "No action needed for this provider." };
  }

  if (mock) {
    return { id, label, level: "mock", summary: mockSummary || "Mock mode is covering local development.", env, powers, nextStep };
  }

  return { id, label, level: "missing", summary: missingSummary, env, powers, nextStep };
}

export async function getSetupStatus() {
  let databaseReady = false;
  let databaseSummary = "Database query failed.";

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseReady = true;
    databaseSummary = (process.env.DATABASE_URL || "").startsWith("file:")
      ? "SQLite is connected for local development."
      : "Database is connected.";
  } catch {
    databaseReady = false;
  }

  let storageReady = false;
  let storageSummary = "Local storage path is missing or unreadable.";
  const storagePath = resolveLocalStorageRoot();

  try {
    const stats = await fs.stat(storagePath);
    storageReady = stats.isDirectory();
    storageSummary = storageReady ? "Private local product storage is available." : storageSummary;
  } catch {
    storageReady = false;
  }

  const licenseProductCount = await prisma.product.count();
  const activeLicenseCount = await prisma.license.count({ where: { status: "Active" } });

  const statuses: SetupStatusItem[] = [
    item({
      id: "discord-oauth",
      label: "Discord OAuth",
      env: ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET", "DISCORD_REDIRECT_URI"],
      powers: ["Customer login", "Customer creation", "Discord account sync", "Portal access"],
      nextStep: "Add Discord OAuth app credentials or use `/api/auth/mock-discord` locally.",
      ready: hasAll(["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET", "DISCORD_REDIRECT_URI"]),
      mock: mockEnabled(),
      readySummary: "OAuth credentials are present.",
      mockSummary: "Mock Discord login is enabled for local workflow testing.",
      missingSummary: "Discord OAuth credentials are missing.",
    }),
    item({
      id: "discord-bot",
      label: "Discord Bot",
      env: ["DISCORD_BOT_TOKEN", "DISCORD_CLIENT_ID", "DISCORD_GUILD_ID", "MXF_API_BASE_URL", "MXF_BOT_API_KEY"],
      powers: ["Slash commands", "Protected website sync", "Ownership checks", "Server linking", "Product role sync", "Bot heartbeat"],
      nextStep: "Keep local mode on until the Discord token/client/guild are ready, then run `npm run bot:register` and `npm run bot:dev`.",
      ready: hasAll(["DISCORD_BOT_TOKEN", "DISCORD_CLIENT_ID"]) && hasAny(["MXF_BOT_API_KEY", "DISCORD_BOT_API_KEY"]),
      mock: process.env.BOT_LOCAL_MODE === "true" && hasAny(["MXF_BOT_API_KEY", "DISCORD_BOT_API_KEY"]),
      readySummary: "Bot token, client ID, and website sync key are present.",
      mockSummary: "Bot local mode is enabled. Website sync keys are ready, but live Discord login can wait.",
      missingSummary: "Bot token/client ID or website sync key is missing.",
    }),
    item({
      id: "paypal",
      label: "PayPal",
      env: ["PAYPAL_ENV", "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID"],
      powers: ["PayPal checkout", "PayPal webhook verification", "Order fulfillment"],
      nextStep: "Add PayPal sandbox credentials and webhook ID for final provider testing.",
      ready: hasAll(["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID"]),
      mock: mockEnabled(),
      readySummary: "PayPal credentials and webhook ID are present.",
      mockSummary: "Mock payment mode can fulfill local PayPal checkout tests.",
      missingSummary: "PayPal credentials are incomplete.",
    }),
    item({
      id: "stripe",
      label: "Stripe",
      env: ["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"],
      powers: ["Stripe Checkout", "Stripe webhook verification", "Order fulfillment"],
      nextStep: "Add Stripe test/live keys and webhook secret for final provider testing.",
      ready: hasAll(["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"]),
      mock: mockEnabled(),
      readySummary: "Stripe credentials and webhook secret are present.",
      mockSummary: "Mock payment mode can fulfill local Stripe checkout tests.",
      missingSummary: "Stripe credentials are incomplete.",
    }),
    item({
      id: "resend",
      label: "Resend Email",
      env: ["RESEND_API_KEY", "FROM_EMAIL", "SUPPORT_EMAIL"],
      powers: ["Welcome emails", "Receipts", "License delivery", "Invoices", "Support updates"],
      nextStep: "Add `RESEND_API_KEY` after verifying the sender domain.",
      ready: hasAll(["RESEND_API_KEY", "FROM_EMAIL", "SUPPORT_EMAIL"]),
      mock: true,
      readySummary: "Resend is configured.",
      mockSummary: "Email delivery records are created locally, but sending is skipped until `RESEND_API_KEY` exists.",
      missingSummary: "Resend credentials are missing.",
    }),
    {
      id: "database",
      label: "Database",
      level: databaseReady ? ((process.env.DATABASE_URL || "").startsWith("file:") ? "mock" : "ready") : "missing",
      summary: databaseSummary,
      env: ["DATABASE_URL"],
      powers: ["Every persistent platform workflow"],
      nextStep: "Use SQLite locally. Switch `DATABASE_URL` to PostgreSQL for production.",
    },
    {
      id: "local-storage",
      label: "Local Storage",
      level: storageReady ? "ready" : "missing",
      summary: storageSummary,
      env: ["STORAGE_PROVIDER", "LOCAL_STORAGE_ROOT"],
      powers: ["Private product files", "Secure downloads", "Release artifacts"],
      nextStep: "Create `storage/products` and upload product files outside `/public`.",
    },
    {
      id: "license-api",
      label: "License API",
      level: licenseProductCount > 0 && activeLicenseCount > 0 ? "ready" : "warning",
      summary:
        licenseProductCount > 0 && activeLicenseCount > 0
          ? "Products and active demo licenses are present."
          : "License API routes exist, but demo products/licenses are not fully seeded.",
      env: ["AUTH_SECRET"],
      powers: ["Activation", "Validation", "Heartbeat", "Deactivation", "Anti-sharing flags"],
      nextStep: "Run `npm run db:setup` to seed products, licenses, releases, and downloads.",
    },
  ];

  return {
    statuses,
    counts: {
      products: licenseProductCount,
      activeLicenses: activeLicenseCount,
      orders: await prisma.order.count(),
      downloads: await prisma.productDownload.count(),
      docs: await prisma.documentationArticle.count(),
      featureFlags: await prisma.featureFlag.count(),
      botHeartbeats: await prisma.botHeartbeat.count(),
    },
  };
}
