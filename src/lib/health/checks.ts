import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { getContentMode } from "@/lib/content-mode";
import { prisma } from "@/lib/db/prisma";
import { resolveLocalStorageRoot } from "@/lib/storage/local";

export type HealthState = "healthy" | "degraded" | "unhealthy";

export type HealthCheck = {
  id: string;
  label: string;
  state: HealthState;
  detail: string;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
};

function elapsed(startedAt: number) {
  return Date.now() - startedAt;
}

function envValue(key: string) {
  return process.env[key]?.trim() || "";
}

function hasUsableEnv(key: string) {
  const value = envValue(key);
  return Boolean(value && !/replace|changeme|placeholder|paste_|your_/i.test(value));
}

function isLocalUrl(value: string) {
  return /(^|\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(value);
}

function isPostgresUrl(value: string) {
  return /^postgres(ql)?:\/\//i.test(value);
}

function maxAgeSeconds() {
  const parsed = Number(process.env.BOT_HEALTH_MAX_AGE_SECONDS || 180);
  return Number.isFinite(parsed) ? Math.max(30, Math.min(3600, parsed)) : 180;
}

function stateRank(state: HealthState) {
  if (state === "unhealthy") return 2;
  if (state === "degraded") return 1;
  return 0;
}

function overallState(checks: HealthCheck[]): HealthState {
  const highest = Math.max(...checks.map((check) => stateRank(check.state)));
  return highest === 2 ? "unhealthy" : highest === 1 ? "degraded" : "healthy";
}

async function databaseCheck(): Promise<HealthCheck> {
  const startedAt = Date.now();

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    return {
      id: "database",
      label: "Database",
      state: "healthy",
      detail: "Database responded to a lightweight query.",
      latencyMs: elapsed(startedAt),
      metadata: {
        provider: isPostgresUrl(envValue("DATABASE_URL")) ? "postgresql" : envValue("DATABASE_URL").startsWith("file:") ? "sqlite" : "unknown",
      },
    };
  } catch (error) {
    return {
      id: "database",
      label: "Database",
      state: "unhealthy",
      detail: error instanceof Error ? error.message : "Database query failed.",
      latencyMs: elapsed(startedAt),
    };
  }
}

async function storageCheck(): Promise<HealthCheck> {
  const startedAt = Date.now();
  const provider = envValue("STORAGE_PROVIDER") || "local";

  if (provider.toLowerCase() !== "local") {
    return {
      id: "storage",
      label: "Private Storage",
      state: "degraded",
      detail: `Storage provider "${provider}" is configured, but only local storage is enabled in this build.`,
      latencyMs: elapsed(startedAt),
    };
  }

  try {
    const root = resolveLocalStorageRoot();
    const publicRoot = path.join(process.cwd(), "public");
    const isPublic = root === publicRoot || root.startsWith(`${publicRoot}${path.sep}`);
    await mkdir(root, { recursive: true });
    const probePath = path.join(root, `.health-${Date.now()}.tmp`);
    await writeFile(probePath, "ok");
    const probeStat = await stat(probePath);
    await rm(probePath, { force: true });

    return {
      id: "storage",
      label: "Private Storage",
      state: isPublic ? "degraded" : "healthy",
      detail: isPublic ? "Storage is writable but appears to be inside /public." : "Private storage root is writable.",
      latencyMs: elapsed(startedAt),
      metadata: {
        provider,
        root,
        probeBytes: probeStat.size,
      },
    };
  } catch (error) {
    return {
      id: "storage",
      label: "Private Storage",
      state: "unhealthy",
      detail: error instanceof Error ? error.message : "Storage probe failed.",
      latencyMs: elapsed(startedAt),
      metadata: { provider },
    };
  }
}

async function botHeartbeatCheck(): Promise<HealthCheck> {
  const startedAt = Date.now();

  try {
    const latest = await prisma.botHeartbeat.findFirst({ orderBy: { createdAt: "desc" } });
    if (!latest) {
      return {
        id: "discord-bot",
        label: "Discord Bot",
        state: "degraded",
        detail: "No bot heartbeat has been recorded yet.",
        latencyMs: elapsed(startedAt),
      };
    }

    const ageSeconds = Math.round((Date.now() - latest.createdAt.getTime()) / 1000);
    const stale = ageSeconds > maxAgeSeconds();
    const statusHealthy = /ready|online|ok|healthy/i.test(latest.status);
    return {
      id: "discord-bot",
      label: "Discord Bot",
      state: stale || !statusHealthy ? "degraded" : "healthy",
      detail: stale ? `Latest heartbeat is stale at ${ageSeconds}s old.` : `Latest heartbeat is ${ageSeconds}s old.`,
      latencyMs: elapsed(startedAt),
      metadata: {
        botId: latest.botId,
        status: latest.status,
        guildCount: latest.guildCount,
        commandCount: latest.commandCount,
        latencyMs: latest.latencyMs,
        websiteApiStatus: latest.websiteApiStatus,
        licenseApiStatus: latest.licenseApiStatus,
        version: latest.version,
        createdAt: latest.createdAt.toISOString(),
      },
    };
  } catch (error) {
    return {
      id: "discord-bot",
      label: "Discord Bot",
      state: "degraded",
      detail: error instanceof Error ? error.message : "Unable to read bot heartbeat.",
      latencyMs: elapsed(startedAt),
    };
  }
}

async function configCheck(): Promise<HealthCheck> {
  const startedAt = Date.now();
  const contentMode = await getContentMode().catch(() => "clean");
  const missing = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "NEXT_PUBLIC_SITE_URL",
    "STORAGE_PROVIDER",
    "LOCAL_STORAGE_ROOT",
  ].filter((key) => !hasUsableEnv(key));
  const productionWarnings = [
    contentMode !== "production" ? "CONTENT_MODE is not production" : "",
    isLocalUrl(envValue("NEXT_PUBLIC_SITE_URL")) ? "NEXT_PUBLIC_SITE_URL points to localhost" : "",
    envValue("MOCK_PROVIDERS_ENABLED") === "true" ? "MOCK_PROVIDERS_ENABLED is true" : "",
    envValue("PAYMENT_PROVIDER_MODE") === "mock" ? "PAYMENT_PROVIDER_MODE is mock" : "",
    envValue("BOT_LOCAL_MODE") === "true" ? "BOT_LOCAL_MODE is true" : "",
    !isPostgresUrl(envValue("DATABASE_URL")) ? "DATABASE_URL is not PostgreSQL" : "",
    !hasUsableEnv("LICENSE_SIGNING_SECRET") ? "LICENSE_SIGNING_SECRET falls back to AUTH_SECRET" : "",
  ].filter(Boolean);

  return {
    id: "configuration",
    label: "Configuration",
    state: missing.length ? "unhealthy" : productionWarnings.length ? "degraded" : "healthy",
    detail: missing.length
      ? `${missing.length} required platform value(s) are missing.`
      : productionWarnings.length
        ? `${productionWarnings.length} production warning(s) need review.`
        : "Required platform configuration is present.",
    latencyMs: elapsed(startedAt),
    metadata: {
      contentMode,
      missing,
      productionWarnings,
    },
  };
}

export async function getPlatformHealth() {
  const startedAt = Date.now();
  const [database, storage, botHeartbeat, configuration] = await Promise.all([
    databaseCheck(),
    storageCheck(),
    botHeartbeatCheck(),
    configCheck(),
  ]);
  const checks = [database, storage, botHeartbeat, configuration];
  const state = overallState(checks);

  return {
    ok: state !== "unhealthy",
    state,
    checkedAt: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    latencyMs: elapsed(startedAt),
    checks,
  };
}
