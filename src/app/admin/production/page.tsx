import { AlertTriangle, CheckCircle2, CircleSlash, Server, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { ContentModeControl } from "@/components/admin/content-mode-control";
import { ReadinessOverview } from "@/components/admin/readiness-overview";
import { requireAdminPage } from "@/lib/auth/page";
import { getLaunchReadiness } from "@/lib/launch/readiness";
import { getProductionReadiness, type ProductionEnvStatus } from "@/lib/launch/production";

export const dynamic = "force-dynamic";

const statusTone: Record<ProductionEnvStatus, string> = {
  configured: "border-[#ff6262]/25 bg-[#ff6262]/10 text-[#ffd8d8]",
  missing: "border-[#ff5f6d]/25 bg-[#ff5f6d]/10 text-[#ffd0dc]",
  optional: "border-white/10 bg-white/[0.04] text-white/50",
};

const deploymentTone = {
  ready: "border-[#ff6262]/25 bg-[#ff6262]/10 text-[#ffd8d8]",
  warning: "border-[#f7b955]/25 bg-[#f7b955]/10 text-[#ffe1a3]",
  blocked: "border-[#ff5f6d]/25 bg-[#ff5f6d]/10 text-[#ffd0dc]",
};

export default async function AdminProductionPage() {
  const admin = await requireAdminPage("settings.manage");
  const [production, readiness] = await Promise.all([getProductionReadiness(), getLaunchReadiness()]);

  const goLiveRequired = [
    { label: "Brand complete", ready: readiness.areas.find((area) => area.id === "brand")?.status === "Complete", href: "/admin/launch" },
    { label: "Homepage complete", ready: readiness.areas.find((area) => area.id === "homepage")?.status === "Complete", href: "/admin/launch" },
    { label: "At least one product published", ready: readiness.areas.find((area) => area.id === "products")?.status === "Complete", href: "/admin/products" },
    { label: "Legal pages complete", ready: readiness.areas.find((area) => area.id === "legal")?.status === "Complete", href: "/admin/legal" },
    { label: "Payment provider configured", ready: readiness.areas.find((area) => area.id === "payments")?.status === "Complete", href: "/admin/production" },
    { label: "Email provider configured", ready: production.env.find((item) => item.key === "RESEND_API_KEY")?.status === "configured", href: "/admin/production" },
    { label: "Discord OAuth configured", ready: production.setup.statuses.find((item) => item.id === "discord-oauth")?.level === "ready", href: "/admin/production" },
    { label: "Discord bot configured", ready: production.setup.statuses.find((item) => item.id === "discord-bot")?.level === "ready", href: "/admin/production" },
    { label: "Storage configured", ready: production.setup.statuses.find((item) => item.id === "local-storage")?.level === "ready", href: "/admin/production" },
    { label: "Production database configured", ready: !(process.env.DATABASE_URL || "").startsWith("file:"), href: "/admin/production" },
    { label: "Downloads tested", ready: readiness.areas.find((area) => area.id === "downloads")?.status === "Complete", href: "/admin/downloads" },
    { label: "License validation tested", ready: production.setup.statuses.find((item) => item.id === "license-api")?.level === "ready", href: "/admin/licenses" },
    { label: "Support tested", ready: production.setup.counts.orders > 0 || production.setup.counts.activeLicenses > 0, href: "/admin/support" },
    { label: "Secrets rotated", ready: readiness.secretsRotated, href: "/admin/launch" },
    { label: "CONTENT_MODE=production", ready: production.contentMode === "production", href: "/admin/production" },
  ];

  return (
    <AdminShell
      title="Production"
      description="Launch configuration readiness for environment variables, provider credentials, secret rotation, content mode, and final go-live checks."
      adminEmail={admin.email}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <article className="surface-strong rounded-lg p-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Environment</p>
          <p className="mt-3 text-3xl font-semibold text-white">{production.score}%</p>
          <p className="mt-2 text-sm text-white/50">{production.requiredConfigured}/{production.requiredTotal} required values configured</p>
        </article>
        <article className="surface rounded-lg p-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Content</p>
          <p className="mt-3 text-3xl font-semibold text-white">{readiness.overallScore}%</p>
          <p className="mt-2 text-sm text-white/50">{readiness.completeAreas}/{readiness.totalAreas} areas complete</p>
        </article>
        <article className="surface rounded-lg p-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Mode</p>
          <p className="mt-3 text-3xl font-semibold capitalize text-white">{production.contentMode}</p>
          <p className="mt-2 text-sm text-white/50">Production mode required for launch.</p>
        </article>
      </div>

      <div className="mt-6">
        <ContentModeControl mode={production.contentMode} />
      </div>

      <section className="mt-6 surface rounded-lg p-5">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-[#ff6262]" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-white">IONOS Readiness</h2>
        </div>
        <p className="mt-2 text-sm text-white/50">This app needs a Node-capable server for API routes, Prisma, private downloads, webhooks, and the Discord bot.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {production.ionosReadiness.map((item) => (
            <article key={item.id} className="rounded-lg border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">{item.label}</h3>
                <span className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${deploymentTone[item.status]}`}>
                  {item.status === "ready" ? "Ready" : item.status === "blocked" ? "Blocked" : "Needs Check"}
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-white/46">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 surface rounded-lg p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#ff6262]" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-white">Required Environment Variables</h2>
        </div>
        <p className="mt-2 text-sm text-white/50">Secret values are never displayed here, only configured/missing status.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {production.env.map((item) => (
            <article key={item.key} className="rounded-lg border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-[#ff6262]">{item.key}</p>
                  <h3 className="mt-2 text-sm font-semibold text-white">{item.label}</h3>
                </div>
                <span className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${statusTone[item.status]}`}>
                  {item.status === "configured" ? "Configured" : item.status === "missing" ? "Missing" : "Optional"}
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-white/42">{item.powers}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="surface rounded-lg p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#f7b955]" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-white">Secret Rotation</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {production.warnings.map((warning) => (
              <article key={warning.id} className="rounded-md border border-[#f7b955]/20 bg-[#f7b955]/8 p-3">
                <p className="text-sm font-semibold text-[#ffe1a3]">{warning.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#ffe1a3]/75">{warning.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="surface rounded-lg p-5">
          <h2 className="text-xl font-semibold text-white">Go Live Checklist</h2>
          <div className="mt-4 grid gap-2">
            {goLiveRequired.map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center justify-between gap-4 rounded-md border border-white/8 bg-white/[0.03] p-3 transition hover:border-[#ff6262]/30">
                <span className="text-sm font-semibold text-white/68">{item.label}</span>
                {item.ready ? <CheckCircle2 className="h-4 w-4 text-[#ff6262]" aria-hidden="true" /> : <CircleSlash className="h-4 w-4 text-[#f7b955]" aria-hidden="true" />}
              </Link>
            ))}
          </div>
        </section>
      </div>

      {production.productionDataWarnings.length ? (
        <section className="mt-6 rounded-lg border border-[#f7b955]/20 bg-[#f7b955]/8 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#f7b955]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[#ffe1a3]">Production Data Warnings</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {production.productionDataWarnings.map((warning) => (
              <article key={warning.id} className="rounded-md border border-[#f7b955]/20 bg-black/18 p-3">
                <p className="text-sm font-semibold text-[#ffe1a3]">{warning.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#ffe1a3]/75">{warning.detail}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {production.contentModeWarnings.length ? (
        <section className="mt-6 rounded-lg border border-[#f7b955]/20 bg-[#f7b955]/8 p-5">
          <h2 className="text-lg font-semibold text-[#ffe1a3]">Content Mode Warnings</h2>
          <div className="mt-3 grid gap-2">
            {production.contentModeWarnings.map((warning) => (
              <p key={warning} className="text-sm text-[#ffe1a3]/80">{warning}</p>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6">
        <ReadinessOverview areas={readiness.areas} title="Launch Content Status" compact />
      </div>
    </AdminShell>
  );
}
