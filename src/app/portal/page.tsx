import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Download, KeyRound, LifeBuoy, PackageCheck, RefreshCw, ServerCog } from "lucide-react";
import Link from "next/link";
import { PortalShell, PortalSignIn } from "@/components/portal/portal-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { getContentMode } from "@/lib/content-mode";
import { prisma } from "@/lib/db/prisma";
import { visibleSupportTickets } from "@/lib/support/visibility";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer Portal",
  description: "MxF Labs customer portal for products, licenses, support tickets, downloads, and Discord settings.",
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstName(name: string) {
  return name.split(/\s+/)[0] || name;
}

export default async function PortalPage({ searchParams }: PageProps) {
  const customer = await getCurrentCustomer();
  const status = (await searchParams)?.status;

  if (!customer) {
    return (
      <PortalShell
        title="Manage your MxF products."
        description="Discord-first access for orders, licenses, downloads, support, updates, and account settings."
        customer={null}
      >
        <PortalSignIn status={typeof status === "string" ? status : undefined} />
      </PortalShell>
    );
  }

  const [licenses, orders, tickets, notifications, announcements, contentMode] = await Promise.all([
    prisma.license.findMany({ where: { customerId: customer.id }, include: { product: true }, orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({ where: { customerId: customer.id }, include: { product: true }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.supportTicket.findMany({ where: { customerId: customer.id }, include: { relatedProduct: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.customerNotification.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.announcement.findMany({ where: { active: true, visibility: "Public" }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 2 }),
    getContentMode(),
  ]);

  const primaryLicense = licenses[0];
  const portalTickets = visibleSupportTickets(tickets, contentMode).slice(0, 4);
  const openTickets = portalTickets.filter((ticket) => !["Resolved", "Closed"].includes(ticket.status));
  const recentActivity = [
    ...notifications.map((notice) => ({ id: notice.id, title: notice.title, detail: notice.body, type: notice.type, at: notice.createdAt })),
    ...portalTickets.map((ticket) => ({ id: ticket.id, title: `Ticket ${ticket.ticketNumber}`, detail: `${ticket.status}: ${ticket.subject}`, type: "Support", at: ticket.createdAt })),
    ...orders.map((order) => ({ id: order.id, title: order.product?.name || "Order", detail: `${order.status} order`, type: "Order", at: order.createdAt })),
    ...announcements.map((announcement) => ({ id: announcement.id, title: announcement.title, detail: announcement.body, type: announcement.type, at: announcement.createdAt })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6);

  const alerts = [
    ...licenses.filter((license) => license.status !== "Active").map((license) => `${license.product?.name || "A product"} license is ${license.status}.`),
    ...(customer.discordId ? [] : ["Discord is not linked. Run Discord login to improve support verification."]),
    ...openTickets.slice(0, 1).map((ticket) => `Open support ticket: ${ticket.subject}`),
  ];

  return (
    <PortalShell
      title={`Welcome back, ${firstName(customer.name)}.`}
      description="A clean command center for owned products, license health, secure downloads, support tickets, and account status."
      customer={customer}
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        {primaryLicense ? (
          <section className="surface-strong relative overflow-hidden rounded-lg p-6">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6262]/55 to-transparent" />
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Primary product</p>
            <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div>
                <h2 className="text-3xl font-semibold text-white">{primaryLicense.product?.name || "Owned product"}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
                  {primaryLicense.product?.shortDescription || "Product access is active on your account."}
                </p>
              </div>
              <span className="w-fit rounded-md border border-[#ff6262]/25 bg-[#ff6262]/10 px-3 py-2 text-xs font-semibold text-[#ffd8d8]">
                {primaryLicense.status}
              </span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Latest version" value={primaryLicense.product?.version || "0.1.0"} />
              <MiniStat label="Activations" value={`${primaryLicense.currentActivations}/${primaryLicense.maxActivations}`} />
              <MiniStat label="License type" value={primaryLicense.licenseType} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionLink href="/portal/downloads" icon={Download} label="Download" primary />
              <ActionLink href="/portal/licenses" icon={KeyRound} label="View license" />
              <ActionLink href={primaryLicense.product?.documentationLink || "/docs"} icon={PackageCheck} label="Docs" />
              <ActionLink href="/portal/support" icon={LifeBuoy} label="Support" />
            </div>
          </section>
        ) : (
          <EmptyState
            icon={PackageCheck}
            title="No products yet."
            description="Once you buy or receive a license, your product command center appears here."
            action={{ label: "Browse products", href: "/products" }}
          />
        )}

        <section className="surface rounded-lg p-5">
          <h2 className="text-xl font-semibold text-white">Quick actions</h2>
          <div className="mt-5 grid gap-3">
            <ActionLink href="/portal/downloads" icon={Download} label="Download latest" />
            <ActionLink href="/portal/licenses" icon={KeyRound} label="View license" />
            <ActionLink href="/portal/support" icon={LifeBuoy} label="Open support ticket" />
            <ActionLink href="/portal/support" icon={RefreshCw} label="Reset HWID/IP" />
            <ActionLink href="/api/auth/discord/start" icon={ServerCog} label="Join / sync Discord" />
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="surface rounded-lg p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">Alerts</h2>
            <AlertCircle className="h-5 w-5 text-[#f7b955]" aria-hidden="true" />
          </div>
          <div className="mt-5 grid gap-3">
            {alerts.length ? (
              alerts.map((alert) => (
                <div key={alert} className="rounded-md border border-[#f7b955]/16 bg-[#f7b955]/8 p-3 text-sm leading-6 text-[#ffe1a3]">
                  {alert}
                </div>
              ))
            ) : (
              <p className="rounded-md border border-white/8 bg-white/[0.03] p-3 text-sm text-white/50">No urgent account alerts.</p>
            )}
          </div>
        </section>

        <section className="surface rounded-lg p-5">
          <h2 className="text-xl font-semibold text-white">Recent activity</h2>
          <div className="mt-5 grid gap-3">
            {recentActivity.length ? (
              recentActivity.map((item) => (
                <div key={`${item.type}-${item.id}`} className="grid gap-2 rounded-md border border-white/8 bg-white/[0.03] p-4 sm:grid-cols-[9rem_1fr_auto] sm:items-center">
                  <p className="font-mono text-xs text-[#ff6262]">{item.type}</p>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/44">{item.detail}</p>
                  </div>
                  <p className="text-xs text-white/34">{item.at.toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <EmptyState title="No activity yet." description="Downloads, license events, tickets, and updates will appear here." />
            )}
          </div>
        </section>
      </div>
    </PortalShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.035] p-3">
      <p className="text-xs text-white/38">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ActionLink({
  href,
  icon: Icon,
  label,
  primary = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "button-shine inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black"
          : "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/72 transition hover:border-[#ff6262]/35 hover:text-white"
      }
    >
      <Icon className="relative z-10 h-4 w-4" aria-hidden="true" />
      <span className="relative z-10">{label}</span>
    </Link>
  );
}
