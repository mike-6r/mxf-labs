import type { LucideIcon } from "lucide-react";
import { Bell, KeyRound, LifeBuoy, Link2, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { PortalShell, PortalSignIn } from "@/components/portal/portal-shell";
import { getCurrentCustomer } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal Settings | MxF Labs" };

export default async function PortalSettingsPage() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <PortalShell title="Settings" description="Sign in to manage customer settings." customer={null}>
        <PortalSignIn />
      </PortalShell>
    );
  }

  return (
    <PortalShell
      title="Account settings."
      description="Identity, Discord sync, product access preferences, and support routing for your MxF Labs customer account."
      customer={customer}
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <section className="surface-strong rounded-lg p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#ff6262]/20 bg-[#ff6262]/10 text-[#ff6262]">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Account</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{customer.name}</h2>
              <p className="mt-2 text-sm text-white/54">{customer.email}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Metric label="Customer since" value={customer.createdAt.toLocaleDateString()} />
            <Metric label="Discord sync" value={customer.discordSyncStatus} />
            <Metric label="Discord username" value={customer.discordUsername || "Not linked"} />
            <Metric label="Last synced" value={customer.discordLastSyncedAt?.toLocaleDateString() || "Never"} />
          </div>
        </section>

        <section className="surface rounded-lg p-5">
          <Link2 className="h-5 w-5 text-[#ff6262]" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-white">Discord connection</h2>
          <p className="mt-2 text-sm leading-6 text-white/54">
            Discord keeps login, product access, bot sync, support verification, and server ownership checks tied together.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="button-shine inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black" href="/portal/settings/discord">
              <ShieldCheck className="relative z-10 h-4 w-4" aria-hidden="true" />
              <span className="relative z-10">Manage Discord</span>
            </Link>
            <Link className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/70 transition hover:border-[#ff6262]/35 hover:text-white" href="/api/auth/discord/start">
              Re-sync
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <Preference icon={KeyRound} title="License privacy" copy="License keys are masked by default across the customer portal." />
        <Preference icon={Bell} title="Product updates" copy="Release notes, alerts, and product events appear in notifications and activity." />
        <Preference icon={LifeBuoy} title="Support routing" copy="Tickets can link to products and licenses for faster triage." />
      </div>
    </PortalShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.03] p-3">
      <p className="text-xs text-white/36">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Preference({ icon: Icon, title, copy }: { icon: LucideIcon; title: string; copy: string }) {
  return (
    <section className="surface rounded-lg p-5">
      <Icon className="h-5 w-5 text-[#ff6262]" aria-hidden="true" />
      <h2 className="mt-4 text-base font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-white/50">{copy}</p>
    </section>
  );
}
