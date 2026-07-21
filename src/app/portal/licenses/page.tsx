import type { LucideIcon } from "lucide-react";
import { Activity, KeyRound, LifeBuoy, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { LicenseActivationList } from "@/components/portal/license-activation-list";
import { LicenseKeyControl } from "@/components/portal/license-key-control";
import { PortalShell, PortalSignIn } from "@/components/portal/portal-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal Licenses | MxF Labs" };

export default async function PortalLicensesPage() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <PortalShell title="Licenses" description="Sign in to view license keys and activation status." customer={null}>
        <PortalSignIn />
      </PortalShell>
    );
  }

  const licenses = await prisma.license.findMany({
    where: { customerId: customer.id },
    include: { product: true, activations: { orderBy: { lastSeenAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PortalShell title="License control." description="Masked keys, activation limits, HWID/IP status, Discord binding, expiration, and support actions." customer={customer}>
      {licenses.length ? (
        <div className="grid gap-5">
          {licenses.map((license) => {
            const latestActivation = license.activations[0];
            return (
              <article key={license.id} className="surface rounded-lg p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">{license.product?.name || "Product"} / {license.licenseType}</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">{license.status} license</h2>
                    <p className="mt-2 text-sm leading-6 text-white/54">
                      Full keys stay hidden until you intentionally reveal or copy them.
                    </p>
                  </div>
                  <span className="w-fit rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/64">
                    {license.expirationDate ? license.expirationDate.toLocaleDateString() : "Never expires"}
                  </span>
                </div>

                <div className="mt-5">
                  <LicenseKeyControl licenseKey={license.key} />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric label="Activations used" value={String(license.currentActivations)} />
                  <Metric label="Max activations" value={String(license.maxActivations)} />
                  <Metric label="HWID status" value={latestActivation?.deviceId ? "Bound" : "Not bound"} />
                  <Metric label="IP status" value={latestActivation?.ipAddress ? "Bound" : "Not bound"} />
                  <Metric label="Discord status" value={latestActivation?.discordId || customer.discordId ? "Linked" : "Not linked"} />
                  <Metric label="Last validation" value={license.lastValidatedAt?.toLocaleString() || latestActivation?.lastSeenAt.toLocaleString() || "No validation yet"} />
                  <Metric label="Minimum version" value={license.minimumVersion || "Any"} />
                  <Metric label="Resets used" value={String(license.resetCount)} />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Action href="/portal/support" icon={RefreshCw} label="Reset HWID/IP request" />
                  <Action href="#activations" icon={Activity} label="View activations" />
                  <Action href="/portal/support" icon={LifeBuoy} label="Open support" />
                  <Action href="/docs" icon={ShieldCheck} label="Docs" />
                </div>

                <div id="activations" className="mt-5 grid gap-2">
                  <LicenseActivationList
                    activations={license.activations.map((activation) => ({
                      id: activation.id,
                      deviceId: activation.deviceId,
                      instanceId: activation.instanceId,
                      ipAddress: activation.ipAddress,
                      discordId: activation.discordId,
                      country: activation.country,
                      productVersion: activation.productVersion,
                      status: activation.status,
                      activationCount: activation.activationCount,
                      firstSeenAt: activation.firstSeenAt.toISOString(),
                      lastSeenAt: activation.lastSeenAt.toISOString(),
                    }))}
                  />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={KeyRound}
          title="No licenses yet."
          description="Licenses appear here after a purchase, assignment, or Discord-created license."
          action={{ label: "Browse products", href: "/products" }}
        />
      )}
    </PortalShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.03] p-3">
      <p className="text-xs text-white/36">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Action({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/70 transition hover:border-[#ff6262]/35 hover:text-white">
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
