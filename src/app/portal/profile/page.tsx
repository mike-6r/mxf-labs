import { PortalShell, PortalSignIn } from "@/components/portal/portal-shell";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { getContentMode } from "@/lib/content-mode";
import { prisma } from "@/lib/db/prisma";
import { visibleSupportTickets } from "@/lib/support/visibility";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal Profile | MxF Labs" };

export default async function PortalProfilePage() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <PortalShell title="Profile" description="Sign in to view your customer profile." customer={null}>
        <PortalSignIn />
      </PortalShell>
    );
  }

  const [orders, licenses, ticketsRaw, logins, contentMode] = await Promise.all([
    prisma.order.count({ where: { customerId: customer.id } }),
    prisma.license.count({ where: { customerId: customer.id } }),
    prisma.supportTicket.findMany({
      where: { customerId: customer.id },
      select: { ticketNumber: true, email: true, discordUsername: true, subject: true, message: true, internalNotes: true },
    }),
    prisma.customerLoginEvent.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    getContentMode(),
  ]);
  const tickets = visibleSupportTickets(ticketsRaw, contentMode).length;

  return (
    <PortalShell title="Profile." description="Customer identity, Discord connection, account history, and product ownership summary." customer={customer}>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="surface rounded-lg p-5">
          <p className="font-mono text-xs text-[#ff6262]">Customer</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{customer.name}</h2>
          <p className="mt-2 text-sm text-white/52">{customer.email}</p>
          <div className="mt-5 grid gap-2 text-sm text-white/54">
            <p>Discord: {customer.discordUsername || "Not linked"}</p>
            <p>Discord ID: {customer.discordId || "Not linked"}</p>
            <p>Sync status: {customer.discordSyncStatus}</p>
          </div>
        </section>
        <section className="surface rounded-lg p-5">
          <h2 className="text-xl font-semibold text-white">Account Summary</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Metric label="Orders" value={orders} />
            <Metric label="Licenses" value={licenses} />
            <Metric label="Tickets" value={tickets} />
          </div>
          <h3 className="mt-6 text-sm font-semibold text-white">Recent login history</h3>
          <div className="mt-3 grid gap-2">
            {logins.map((login) => (
              <div key={login.id} className="rounded-md border border-white/8 bg-white/[0.035] p-3 text-xs text-white/48">
                {login.provider} / {login.status} / {login.ipAddress || "No IP"} / {login.createdAt.toLocaleString()}
              </div>
            ))}
          </div>
        </section>
      </div>
    </PortalShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.035] p-4">
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/44">{label}</p>
    </div>
  );
}
