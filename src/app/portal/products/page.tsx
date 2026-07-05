import type { LucideIcon } from "lucide-react";
import { BookOpen, Download, KeyRound, LifeBuoy, PackageOpen } from "lucide-react";
import Link from "next/link";
import { PortalShell, PortalSignIn } from "@/components/portal/portal-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Portal Products | MxF Labs",
};

export default async function PortalProductsPage() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <PortalShell title="Products" description="Sign in to view owned products." customer={null}>
        <PortalSignIn />
      </PortalShell>
    );
  }

  const licenses = await prisma.license.findMany({
    where: { customerId: customer.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  const productMap = new Map<string, (typeof licenses)[number]>();
  for (const license of licenses) {
    if (license.productId && !productMap.has(license.productId)) productMap.set(license.productId, license);
  }
  const ownedProducts = [...productMap.values()];

  return (
    <PortalShell title="Software library." description="Owned products, latest versions, license health, downloads, docs, changelogs, and support." customer={customer}>
      {ownedProducts.length ? (
        <div className="grid gap-5">
          {ownedProducts.map((license, index) => (
            <article key={license.id} className={index === 0 ? "surface-strong rounded-lg p-6" : "surface rounded-lg p-5"}>
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">{license.status}</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">{license.product?.name || "Product"}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">
                    {license.product?.shortDescription || "Product access is attached to this license."}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-md border border-white/8 bg-white/[0.03] p-3 text-center">
                  <Mini label="Version" value={license.product?.version || "0.1.0"} />
                  <Mini label="Activations" value={`${license.currentActivations}/${license.maxActivations}`} />
                  <Mini label="Type" value={license.licenseType} />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Action href="/portal/downloads" icon={Download} label="Download" primary={index === 0} />
                <Action href={license.product?.documentationLink || `/docs/${license.product?.slug || ""}`} icon={BookOpen} label="Docs" />
                <Action href="/changelog" icon={PackageOpen} label="Changelog" />
                <Action href="/portal/support" icon={LifeBuoy} label="Support" />
                <Action href="/portal/licenses" icon={KeyRound} label="Manage license" />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PackageOpen}
          title="No products yet."
          description="Your software library appears after a purchase, manual assignment, or Discord-created license."
          action={{ label: "Browse products", href: "/products" }}
        />
      )}
    </PortalShell>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/36">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Action({ href, icon: Icon, label, primary = false }: { href: string; icon: LucideIcon; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "button-shine inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black"
          : "inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/70 transition hover:border-[#ff6262]/35 hover:text-white"
      }
    >
      <Icon className="relative z-10 h-4 w-4" aria-hidden="true" />
      <span className="relative z-10">{label}</span>
    </Link>
  );
}
