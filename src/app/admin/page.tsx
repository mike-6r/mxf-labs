import { AlertTriangle, CheckCircle2, CreditCard, KeyRound, LifeBuoy, PackageCheck, PlugZap, Settings } from "lucide-react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { ReadinessOverview } from "@/components/admin/readiness-overview";
import { requireAdminPage } from "@/lib/auth/page";
import { getContentMode, isDemoText, shouldShowDemoData } from "@/lib/content-mode";
import { prisma } from "@/lib/db/prisma";
import { getLaunchReadiness } from "@/lib/launch/readiness";
import { getSetupStatus } from "@/lib/setup/status";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await requireAdminPage("dashboard.read");
  const contentMode = await getContentMode();
  const [
    setup,
    productsPublished,
    openTicketsRaw,
    activeLicenses,
    recentOrdersRaw,
    botHeartbeat,
    readiness,
  ] = await Promise.all([
    getSetupStatus(),
    prisma.product.count({ where: { visible: true, status: { in: ["Active", "Published", "Public"] } } }),
    prisma.supportTicket.findMany({ where: { status: { notIn: ["Resolved", "Closed"] } }, orderBy: { updatedAt: "desc" } }),
    prisma.license.count({ where: { status: "Active" } }),
    prisma.order.findMany({ include: { product: true, customer: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.botHeartbeat.findFirst({ orderBy: { createdAt: "desc" } }),
    getLaunchReadiness(),
  ]);

  const openTickets = shouldShowDemoData(contentMode)
    ? openTicketsRaw
    : openTicketsRaw.filter((ticket) => !isDemoText(ticket.email, ticket.discordUsername, ticket.subject, ticket.message, ticket.internalNotes));
  const recentOrders = shouldShowDemoData(contentMode)
    ? recentOrdersRaw
    : recentOrdersRaw.filter((order) => !isDemoText(order.notes, order.providerOrderId, order.customer?.email, order.customer?.name, order.product?.name));
  const missingSetup = setup.statuses.filter((item) => item.level === "missing" || item.level === "warning");
  const readySetupCount = setup.statuses.filter((item) => item.level === "ready").length;
  const discordBotStatus = botHeartbeat ? `Last heartbeat ${botHeartbeat.createdAt.toLocaleString()}` : "No heartbeat yet";

  const checklist = [
    { label: "Brand configured", ready: true, href: "/admin/customize" },
    { label: "Products published", ready: productsPublished > 0, href: "/admin/products" },
    { label: "Legal pages completed", ready: readiness.areas.find((item) => item.id === "legal")?.status === "Complete", href: "/admin/launch-wizard" },
    { label: "Payments configured", ready: setup.statuses.some((item) => ["stripe", "paypal"].includes(item.id) && item.level === "ready"), href: "/admin/setup-status" },
    { label: "Discord connected", ready: setup.statuses.some((item) => item.id === "discord-oauth" && item.level === "ready"), href: "/admin/discord" },
    { label: "Email configured", ready: setup.statuses.some((item) => item.id === "resend" && item.level === "ready"), href: "/admin/emails" },
    { label: "Storage configured", ready: setup.statuses.some((item) => item.id === "local-storage" && item.level === "ready"), href: "/admin/downloads" },
    { label: "Production database configured", ready: !(process.env.DATABASE_URL || "").startsWith("file:"), href: "/admin/setup-status" },
  ];

  return (
    <AdminShell
      title="Dashboard"
      description={`Clean launch control center for setup, products, customers, orders, support, licenses, and Discord. Content mode: ${contentMode}.`}
      adminEmail={admin.email}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Setup status" value={`${readySetupCount}/${setup.statuses.length}`} detail={`${missingSetup.length} warnings or missing items`} icon={Settings} />
        <AdminStatCard label="Products published" value={productsPublished} detail="Visible active products" icon={PackageCheck} />
        <AdminStatCard label="Open support tickets" value={openTickets.length} detail="Demo/test hidden outside demo mode" icon={LifeBuoy} />
        <AdminStatCard label="Active licenses" value={activeLicenses} detail="License API ownership" icon={KeyRound} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="surface-strong rounded-lg p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Launch Checklist</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">What still blocks production.</h2>
            </div>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/54">
              {checklist.filter((item) => item.ready).length}/{checklist.length}
            </span>
          </div>
          <div className="mt-5 grid gap-2">
            {checklist.map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center justify-between gap-4 rounded-md border border-white/8 bg-white/[0.03] p-3 transition hover:border-[#ff6262]/30">
                <span className="text-sm font-semibold text-white/72">{item.label}</span>
                {item.ready ? <CheckCircle2 className="h-4 w-4 text-[#ff6262]" aria-hidden="true" /> : <AlertTriangle className="h-4 w-4 text-[#f7b955]" aria-hidden="true" />}
              </Link>
            ))}
          </div>
        </section>

        <section className="surface rounded-lg p-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Missing configuration</p>
          <div className="mt-4 grid gap-3">
            {missingSetup.slice(0, 6).map((item) => (
              <Link key={item.id} href="/admin/setup-status" className="rounded-md border border-white/8 bg-white/[0.03] p-3 transition hover:border-[#ff6262]/30">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-white/46">{item.summary}</p>
              </Link>
            ))}
            {!missingSetup.length ? <p className="rounded-md border border-[#ff6262]/20 bg-[#ff6262]/8 p-3 text-sm text-[#ffd8d8]">All setup checks are ready.</p> : null}
          </div>
        </section>
      </div>

      <div className="mt-6">
        <ReadinessOverview areas={readiness.areas} title="Launch Content Status" compact />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <section className="surface rounded-lg p-5">
          <PlugZap className="h-5 w-5 text-[#ff6262]" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-white">Discord bot status</h2>
          <p className="mt-2 text-sm leading-6 text-white/52">{discordBotStatus}</p>
          <Link href="/admin/discord" className="mt-5 inline-flex min-h-10 items-center rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/68 transition hover:border-[#ff6262]/35 hover:text-white">
            Open Discord
          </Link>
        </section>

        <section className="surface rounded-lg p-5 xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">Recent orders</h2>
            <CreditCard className="h-5 w-5 text-[#ff6262]" aria-hidden="true" />
          </div>
          <div className="mt-4 grid gap-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="grid gap-2 rounded-md border border-white/8 bg-white/[0.03] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-white">{order.product?.name || "Product"} / {order.status}</p>
                  <p className="mt-1 text-xs text-white/42">{order.customer?.email || "No customer"} / {order.provider}</p>
                </div>
                <p className="text-sm font-semibold text-white/70">{order.currency} {(order.amountCents / 100).toFixed(2)}</p>
              </div>
            ))}
            {!recentOrders.length ? <p className="rounded-md border border-white/8 bg-white/[0.03] p-3 text-sm text-white/46">No real orders in this content mode yet.</p> : null}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
