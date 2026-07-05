import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth/page";
import { getContentMode, isDemoText, shouldShowDemoData } from "@/lib/content-mode";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const admin = await requireAdminPage("customers.manage");
  const [customers, contentMode] = await Promise.all([
    prisma.customer.findMany({
      include: {
        orders: { include: { product: true }, orderBy: { createdAt: "desc" } },
        licenses: { include: { product: true }, orderBy: { createdAt: "desc" } },
        supportTickets: { orderBy: { updatedAt: "desc" } },
        discordServers: true,
        activityLogs: { orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: { updatedAt: "desc" },
    }),
    getContentMode(),
  ]);

  const visibleCustomers = shouldShowDemoData(contentMode)
    ? customers
    : customers.filter((customer) => !isDemoText(customer.email, customer.name, customer.discordUsername, customer.discordGlobalName, customer.notes));

  return (
    <AdminShell
      title="Customers"
      description={`Clean customer list with ownership, revenue, Discord status, support, and activity. Content mode: ${contentMode}.`}
      adminEmail={admin.email}
    >
      <div className="surface mb-5 rounded-lg p-4">
        <div className="grid gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/38 md:grid-cols-[1.4fr_0.8fr_0.7fr_0.6fr_0.6fr_0.6fr_0.7fr_0.8fr]">
          <span>Customer</span>
          <span>Status</span>
          <span>Discord</span>
          <span>Products</span>
          <span>Licenses</span>
          <span>Tickets</span>
          <span>Revenue</span>
          <span>Last activity</span>
        </div>
      </div>

      <div className="grid gap-3">
        {visibleCustomers.map((customer) => {
          const revenue = customer.orders.reduce((total, order) => total + order.amountCents - order.discountCents, 0);
          const productsOwned = new Set(customer.licenses.map((license) => license.product?.name).filter(Boolean));
          const lastActivity = customer.activityLogs[0]?.createdAt || customer.updatedAt;

          return (
            <details key={customer.id} className="surface rounded-lg p-4">
              <summary className="cursor-pointer list-none">
                <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.7fr_0.6fr_0.6fr_0.6fr_0.7fr_0.8fr] md:items-center">
                  <div>
                    <h2 className="text-base font-semibold text-white">{customer.name}</h2>
                    <p className="mt-1 text-xs text-white/42">{customer.email}</p>
                  </div>
                  <Cell>{customer.discordSyncStatus}</Cell>
                  <Cell>@{customer.discordUsername || "not-linked"}</Cell>
                  <Cell>{productsOwned.size}</Cell>
                  <Cell>{customer.licenses.length}</Cell>
                  <Cell>{customer.supportTickets.length}</Cell>
                  <Cell>${(revenue / 100).toFixed(2)}</Cell>
                  <Cell>{lastActivity.toLocaleDateString()}</Cell>
                </div>
              </summary>

              <div className="mt-5 grid gap-5 border-t border-white/8 pt-5 xl:grid-cols-[0.8fr_1.2fr]">
                <section className="rounded-lg border border-white/8 bg-white/[0.03] p-4">
                  <h3 className="text-lg font-semibold text-white">Profile</h3>
                  <div className="mt-4 grid gap-3">
                    <Detail label="Email" value={customer.email} />
                    <Detail label="Discord ID" value={customer.discordId || "Not linked"} />
                    <Detail label="Discord global name" value={customer.discordGlobalName || "Not linked"} />
                    <Detail label="Discord servers" value={String(customer.discordServers.length)} />
                    <Detail label="Notes" value={customer.notes || "No admin notes"} />
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                  <Panel title="Products owned">
                    {[...productsOwned].map((product) => <Row key={product}>{product}</Row>)}
                    {!productsOwned.size ? <Row>No products owned.</Row> : null}
                  </Panel>
                  <Panel title="Licenses">
                    {customer.licenses.slice(0, 5).map((license) => (
                      <Row key={license.id}>{license.product?.name || "Product"} / {license.status} / {license.currentActivations}/{license.maxActivations}</Row>
                    ))}
                    {!customer.licenses.length ? <Row>No licenses.</Row> : null}
                  </Panel>
                  <Panel title="Orders">
                    {customer.orders.slice(0, 5).map((order) => (
                      <Row key={order.id}>{order.product?.name || "Product"} / {order.status} / ${(order.amountCents / 100).toFixed(2)}</Row>
                    ))}
                    {!customer.orders.length ? <Row>No orders.</Row> : null}
                  </Panel>
                  <Panel title="Support tickets">
                    {customer.supportTickets.slice(0, 5).map((ticket) => (
                      <Row key={ticket.id}>{ticket.ticketNumber} / {ticket.status} / {ticket.subject}</Row>
                    ))}
                    {!customer.supportTickets.length ? <Row>No tickets.</Row> : null}
                  </Panel>
                </section>

                <section className="rounded-lg border border-white/8 bg-white/[0.03] p-4 xl:col-span-2">
                  <h3 className="text-lg font-semibold text-white">Activity</h3>
                  <div className="mt-4 grid gap-2">
                    {customer.activityLogs.map((activity) => (
                      <Row key={activity.id}>{activity.action} / {activity.entityType} / {activity.createdAt.toLocaleString()}</Row>
                    ))}
                    {!customer.activityLogs.length ? <Row>No customer activity yet.</Row> : null}
                  </div>
                </section>
              </div>
            </details>
          );
        })}
        {!visibleCustomers.length ? (
          <section className="surface rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-white">No customers in this content mode.</h2>
            <p className="mt-2 text-sm text-white/48">Switch to demo mode in Settings to view seed/mock/flow customers.</p>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <p className="truncate text-sm text-white/58">{children}</p>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/34">{label}</p>
      <p className="mt-1 break-words text-sm text-white/64">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/8 bg-white/[0.03] p-4">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <div className="mt-3 grid gap-2">{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-white/8 bg-black/18 px-3 py-2 text-xs leading-5 text-white/48">{children}</p>;
}
