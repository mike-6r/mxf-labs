import { CreditCard, Download, KeyRound, LifeBuoy, PackageCheck, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { requireAdminPage } from "@/lib/auth/page";
import { getContentMode, isDemoText, shouldShowDemoData } from "@/lib/content-mode";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const admin = await requireAdminPage("analytics.read");
  const contentMode = await getContentMode();
  const [customersRaw, ordersRaw, licenses, activeLicenses, downloads, validations, failedValidations, ticketsRaw] = await Promise.all([
    prisma.customer.findMany(),
    prisma.order.findMany({ include: { customer: true, product: true } }),
    prisma.license.count(),
    prisma.license.count({ where: { status: "Active" } }),
    prisma.downloadEvent.count(),
    prisma.licenseValidation.count(),
    prisma.licenseValidation.count({ where: { result: "failed" } }),
    prisma.supportTicket.findMany(),
  ]);

  const customers = shouldShowDemoData(contentMode)
    ? customersRaw
    : customersRaw.filter((customer) => !isDemoText(customer.email, customer.name, customer.discordUsername, customer.notes));
  const orders = shouldShowDemoData(contentMode)
    ? ordersRaw
    : ordersRaw.filter((order) => !isDemoText(order.notes, order.providerOrderId, order.customer?.email, order.customer?.name, order.product?.name));
  const tickets = shouldShowDemoData(contentMode)
    ? ticketsRaw
    : ticketsRaw.filter((ticket) => !isDemoText(ticket.email, ticket.discordUsername, ticket.subject, ticket.message, ticket.internalNotes));

  const paidOrders = orders.filter((order) => order.status === "Paid");
  const revenue = paidOrders.reduce((total, order) => total + order.amountCents - order.discountCents, 0);
  const hasRealActivity = customers.length > 0 || paidOrders.length > 0 || downloads > 0 || validations > 0 || tickets.length > 0;

  return (
    <AdminShell
      title="Analytics"
      description={`Real platform activity only. Content mode: ${contentMode}${contentMode === "demo" ? " (demo analytics visible)" : ""}.`}
      adminEmail={admin.email}
    >
      {contentMode === "demo" ? (
        <div className="mb-5 rounded-lg border border-[#f7b955]/20 bg-[#f7b955]/8 p-4 text-sm text-[#ffe1a3]">
          Demo mode is active. Seed/test revenue and workflow events are visible for local testing.
        </div>
      ) : null}

      {hasRealActivity ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard label="Revenue" value={`$${(revenue / 100).toFixed(2)}`} detail={`${paidOrders.length} paid orders`} icon={CreditCard} />
          <AdminStatCard label="Customers" value={customers.length} detail="Visible customer records" icon={Users} />
          <AdminStatCard label="Active licenses" value={activeLicenses} detail={`${licenses} total licenses`} icon={KeyRound} />
          <AdminStatCard label="Downloads" value={downloads} detail="Delivery events" icon={Download} />
          <AdminStatCard label="Validation requests" value={validations} detail={`${failedValidations} failed validations`} icon={PackageCheck} />
          <AdminStatCard label="Support volume" value={tickets.length} detail="Visible tickets" icon={LifeBuoy} />
        </div>
      ) : (
        <section className="surface rounded-lg p-8 text-center">
          <PackageCheck className="mx-auto h-6 w-6 text-[#ff6262]" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-semibold text-white">No analytics yet.</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-white/52">
            Activity will appear after real orders, licenses, downloads, and support events.
          </p>
        </section>
      )}
    </AdminShell>
  );
}
