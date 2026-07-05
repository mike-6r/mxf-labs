import { CheckCircle2, CircleAlert, CircleDashed, CircleSlash } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ReadinessOverview } from "@/components/admin/readiness-overview";
import { requireAdminPage } from "@/lib/auth/page";
import { getLaunchReadiness } from "@/lib/launch/readiness";
import { getProductionReadiness } from "@/lib/launch/production";
import { getSetupStatus, type SetupStatusLevel } from "@/lib/setup/status";

export const dynamic = "force-dynamic";

const tone: Record<SetupStatusLevel, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  ready: {
    label: "Ready",
    className: "border-[#ff6262]/25 bg-[#ff6262]/10 text-[#ffd8d8]",
    icon: CheckCircle2,
  },
  mock: {
    label: "Mock/local",
    className: "border-[#f7b955]/25 bg-[#f7b955]/10 text-[#ffe1a3]",
    icon: CircleDashed,
  },
  warning: {
    label: "Warning",
    className: "border-[#f7b955]/25 bg-[#f7b955]/10 text-[#ffe1a3]",
    icon: CircleAlert,
  },
  missing: {
    label: "Missing",
    className: "border-[#ff5f6d]/25 bg-[#ff5f6d]/10 text-[#ffd0dc]",
    icon: CircleSlash,
  },
};

export default async function AdminSetupStatusPage() {
  const admin = await requireAdminPage("settings.manage");
  const [setup, readiness, production] = await Promise.all([getSetupStatus(), getLaunchReadiness(), getProductionReadiness()]);

  return (
    <AdminShell
      title="Setup Status"
      description="Environment readiness for Discord, payments, email, database, storage, downloads, and licensing."
      adminEmail={admin.email}
    >
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Object.entries(setup.counts).map(([label, value]) => (
          <article key={label} className="surface rounded-lg p-4">
            <p className="font-mono text-xs text-[#ff6262]">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
          </article>
        ))}
      </div>

      <div className="mt-6">
        <ReadinessOverview areas={readiness.areas} title="Content Completion Status" compact />
      </div>

      {production.productionDataWarnings.length ? (
        <section className="mt-6 rounded-lg border border-[#f7b955]/20 bg-[#f7b955]/8 p-5">
          <div className="flex items-center gap-2">
            <CircleAlert className="h-5 w-5 text-[#f7b955]" aria-hidden="true" />
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

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {setup.statuses.map((status) => {
          const currentTone = tone[status.level];
          const Icon = currentTone.icon;
          return (
            <article key={status.id} className="surface rounded-lg p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <p className="font-mono text-xs text-[#ff6262]">{status.id}</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{status.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/54">{status.summary}</p>
                </div>
                <span className={`inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${currentTone.className}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {currentTone.label}
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/42">Environment</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {status.env.map((key) => (
                      <code key={key} className="rounded-md border border-white/10 bg-black/24 px-2 py-1 text-xs text-white/58">
                        {key}
                      </code>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/42">Powers</h3>
                  <ul className="mt-3 grid gap-1">
                    {status.powers.map((power) => (
                      <li key={power} className="text-xs leading-5 text-white/52">{power}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="mt-5 rounded-md border border-white/8 bg-white/[0.035] p-3 text-xs leading-5 text-white/50">
                {status.nextStep}
              </p>
            </article>
          );
        })}
      </div>
    </AdminShell>
  );
}
