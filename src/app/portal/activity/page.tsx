import type { LucideIcon } from "lucide-react";
import { ActivityIcon, Download, ShieldCheck } from "lucide-react";
import { PortalShell, PortalSignIn } from "@/components/portal/portal-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal Activity | MxF Labs" };

export default async function PortalActivityPage() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <PortalShell title="Activity" description="Sign in to view account and product activity." customer={null}>
        <PortalSignIn />
      </PortalShell>
    );
  }

  const [activity, downloads, validations] = await Promise.all([
    prisma.customerActivity.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.downloadEvent.findMany({ where: { customerId: customer.id }, include: { download: { include: { product: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.licenseValidation.findMany({ where: { license: { customerId: customer.id } }, include: { product: true }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <PortalShell title="Activity." description="A customer-visible timeline of account actions, downloads, and license validation events." customer={customer}>
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Account">
          {activity.map((event) => (
            <Item key={event.id} title={event.action} meta={`${event.entityType} / ${event.createdAt.toLocaleString()}`} />
          ))}
          {!activity.length ? <PanelEmpty icon={ActivityIcon} title="No account activity yet." /> : null}
        </Panel>
        <Panel title="Downloads">
          {downloads.map((event) => (
            <Item key={event.id} title={event.status} meta={`${event.download?.product.name || "Product"} / ${event.createdAt.toLocaleString()}`} />
          ))}
          {!downloads.length ? <PanelEmpty icon={Download} title="No download events yet." /> : null}
        </Panel>
        <Panel title="License Checks">
          {validations.map((event) => (
            <Item key={event.id} title={event.reason} meta={`${event.product?.name || "Product"} / ${event.result} / ${event.createdAt.toLocaleString()}`} />
          ))}
          {!validations.length ? <PanelEmpty icon={ShieldCheck} title="No license checks yet." /> : null}
        </Panel>
      </div>
      {!activity.length && !downloads.length && !validations.length ? (
        <EmptyState
          className="mt-5"
          icon={ActivityIcon}
          title="No visible activity yet."
          description="Downloads, license validations, support updates, and account changes will appear here as you use the platform."
          action={{ label: "Go to products", href: "/portal/products" }}
        />
      ) : null}
    </PortalShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface rounded-lg p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-5 grid gap-3">{children}</div>
    </section>
  );
}

function PanelEmpty({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.025] p-4 text-center">
      <Icon className="mx-auto h-4 w-4 text-[#ff6262]" aria-hidden="true" />
      <p className="mt-2 text-xs text-white/42">{title}</p>
    </div>
  );
}

function Item({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.035] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-white/42">{meta}</p>
    </div>
  );
}
