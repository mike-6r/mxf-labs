import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export default async function AdminPaymentsPage() {
  const admin = await requireAdminPage("payments.manage");
  const [orders, paymentEvents, refunds, invoices] = await Promise.all([
    prisma.order.findMany({ include: { customer: true, product: true, invoice: true }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.paymentEvent.findMany({ include: { order: true, customer: true }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.refund.findMany({ include: { order: true }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.invoice.findMany({ include: { customer: true, order: { include: { product: true } } }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);

  return (
    <AdminShell
      title="Payments"
      description="Stripe and PayPal readiness, order settlement, invoices, tax totals, refunds, and webhook event processing."
      adminEmail={admin.email}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Stripe" value={process.env.STRIPE_SECRET_KEY ? "Configured" : "Awaiting key"} />
        <Stat label="PayPal" value={process.env.PAYPAL_CLIENT_ID ? "Configured" : "Awaiting key"} />
        <Stat label="Invoices" value={invoices.length} />
        <Stat label="Refunds" value={refunds.length} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Invoices">
          {invoices.map((invoice) => (
            <Item key={invoice.id} title={invoice.invoiceNumber} meta={`${invoice.status} / ${money(invoice.totalCents, invoice.currency)} / ${invoice.customer?.email || "No customer"}`} />
          ))}
        </Panel>
        <Panel title="Orders">
          {orders.map((order) => (
            <Item key={order.id} title={order.product?.name || "Product"} meta={`${order.status} / ${order.provider} / ${money(order.amountCents + order.taxCents, order.currency)}`} />
          ))}
        </Panel>
        <Panel title="Payment Events">
          {paymentEvents.map((event) => (
            <Item key={event.id} title={event.eventType} meta={`${event.provider} / ${event.processingStatus} / ${event.createdAt.toLocaleString()}`} />
          ))}
        </Panel>
        <Panel title="Refunds">
          {refunds.map((refund) => (
            <Item key={refund.id} title={refund.provider} meta={`${refund.status} / ${money(refund.amountCents, refund.order.currency)} / ${refund.reason || "No reason"}`} />
          ))}
        </Panel>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="surface rounded-lg p-5">
      <p className="font-mono text-xs text-[#ff6262]">{label}</p>
      <p className="mt-4 text-2xl font-semibold text-white">{value}</p>
    </article>
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

function Item({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.035] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-white/42">{meta}</p>
    </div>
  );
}
