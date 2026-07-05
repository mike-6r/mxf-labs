import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

for (const envFile of [".env.production", ".env"]) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, override: false, quiet: true });
  }
}

const knownDefaultAuthSecretHashes = new Set(["523fa353f8cc1e761da06107e02388a569cc450a495ce7147510999cc5916a96"]);
const warnOnly = process.env.PRODUCTION_CHECK_WARN_ONLY === "true";
const errors = [];
const warnings = [];
const ok = [];

function value(key) {
  return (process.env[key] || "").trim();
}

function configured(key) {
  const current = value(key);
  return Boolean(current && !/replace|changeme|placeholder|your-|example/i.test(current));
}

function addOk(label) {
  ok.push(label);
}

function addWarning(label) {
  warnings.push(label);
}

function addError(label) {
  errors.push(label);
}

function isLocalUrl(current) {
  return /(^|\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(current);
}

function isPostgresUrl(current) {
  return /^postgres(ql)?:\/\//i.test(current);
}

function isKnownDefaultAuthSecret(current) {
  if (!current) return false;
  return knownDefaultAuthSecretHashes.has(createHash("sha256").update(current).digest("hex"));
}

function requireEnv(key, label = key) {
  if (configured(key)) addOk(`${label} configured`);
  else addError(`${label} is missing or still a placeholder (${key})`);
}

const requiredKeys = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXT_PUBLIC_SITE_URL",
  "CONTENT_MODE",
  "MOCK_PROVIDERS_ENABLED",
  "PAYMENT_PROVIDER_MODE",
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "DISCORD_PUBLIC_KEY",
  "DISCORD_REDIRECT_URI",
  "DISCORD_BOT_TOKEN",
  "DISCORD_GUILD_ID",
  "MXF_API_BASE_URL",
  "MXF_BOT_API_KEY",
  "BOT_LOCAL_MODE",
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "PAYPAL_ENV",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_WEBHOOK_ID",
  "RESEND_API_KEY",
  "FROM_EMAIL",
  "SUPPORT_EMAIL",
  "STORAGE_PROVIDER",
  "LOCAL_STORAGE_ROOT",
];

for (const key of requiredKeys) {
  requireEnv(key);
}

if (!isPostgresUrl(value("DATABASE_URL"))) {
  addError("DATABASE_URL must use PostgreSQL for production. Keep SQLite only for local development.");
}

if (value("CONTENT_MODE") !== "production") {
  addError("CONTENT_MODE must be production on the live server.");
}

if (value("MOCK_PROVIDERS_ENABLED") === "true" || value("PAYMENT_PROVIDER_MODE") === "mock") {
  addError("Mock providers/payment mode are still enabled.");
}

if (value("BOT_LOCAL_MODE") === "true") {
  addError("BOT_LOCAL_MODE must be false for the live Discord bot.");
}

for (const key of ["NEXT_PUBLIC_SITE_URL", "DISCORD_REDIRECT_URI", "MXF_API_BASE_URL"]) {
  if (isLocalUrl(value(key))) {
    addError(`${key} still points at localhost or a loopback address.`);
  }
}

if (!value("NEXT_PUBLIC_SITE_URL").startsWith("https://")) {
  addError("NEXT_PUBLIC_SITE_URL must use https:// for production.");
}

if (!value("DISCORD_REDIRECT_URI").startsWith("https://")) {
  addError("DISCORD_REDIRECT_URI must use https:// for production.");
}

if (value("PAYPAL_ENV") !== "live") {
  addWarning("PAYPAL_ENV is not live. Sandbox is fine for final provider testing, not public launch.");
}

if (value("STRIPE_SECRET_KEY").startsWith("sk_test") || value("STRIPE_PUBLISHABLE_KEY").startsWith("pk_test")) {
  addWarning("Stripe test keys are configured. Use live keys for public launch.");
}

if (value("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") && value("STRIPE_PUBLISHABLE_KEY") && value("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") !== value("STRIPE_PUBLISHABLE_KEY")) {
  addWarning("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY does not match STRIPE_PUBLISHABLE_KEY.");
}

if (!configured("DISCORD_WEBHOOK_URL")) {
  addWarning("DISCORD_WEBHOOK_URL is missing. Discord notification webhooks will be unavailable.");
}

if (!configured("IONOS_DEPLOY_TARGET")) {
  addWarning("IONOS_DEPLOY_TARGET is not set. Use IONOS_DEPLOY_TARGET=vps after choosing the IONOS VPS/Cloud plan.");
}

const authSecret = value("AUTH_SECRET");
if (authSecret.length < 32 || /changeme|replace|placeholder|development|dev-secret|local-secret|test-secret/i.test(authSecret) || isKnownDefaultAuthSecret(authSecret)) {
  addError("AUTH_SECRET must be a fresh production-only secret with at least 32 characters.");
}

const storageRoot = value("LOCAL_STORAGE_ROOT") || "storage/products";
const resolvedStorage = path.isAbsolute(storageRoot) ? path.resolve(storageRoot) : path.resolve(process.cwd(), storageRoot);
const publicRoot = path.resolve(process.cwd(), "public");

if (resolvedStorage === publicRoot || resolvedStorage.startsWith(`${publicRoot}${path.sep}`)) {
  addError("LOCAL_STORAGE_ROOT must not point inside /public. Product files must stay private.");
} else {
  addOk("LOCAL_STORAGE_ROOT is outside /public");
}

if (!fs.existsSync(resolvedStorage)) {
  addWarning(`LOCAL_STORAGE_ROOT does not exist yet: ${resolvedStorage}`);
}

if (value("STORAGE_PROVIDER") !== "local") {
  addError("Only STORAGE_PROVIDER=local is enabled in this build.");
}

console.log("MxF Labs production readiness check");
console.log("");

for (const item of ok) console.log(`[ok] ${item}`);
for (const item of warnings) console.log(`[warn] ${item}`);
for (const item of errors) console.log(`[error] ${item}`);

console.log("");
console.log(`Summary: ${ok.length} ok, ${warnings.length} warnings, ${errors.length} errors.`);

if (errors.length && !warnOnly) {
  process.exit(1);
}
