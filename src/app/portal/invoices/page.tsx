import { ReceiptText } from "lucide-react";
import { PortalShell, PortalSignIn } from "@/components/portal/portal-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal Invoices | MxF Labs" };

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export default async function PortalInvoicesPage() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <PortalShell title="Invoices" description="Sign in to view receipts and invoice history." customer={null}>
        <PortalSignIn />
      </PortalShell>
    );
  }

  const invoices = await prisma.invoice.findMany({
    where: { customerId: customer.id },
    include: { order: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PortalShell title="Invoices." description="Receipts, tax totals, provider settlement status, and invoice records for purchased products." customer={customer}>
      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <article key={invoice.id} className="surface rounded-lg p-5">
            <p className="font-mono text-xs text-[#ff6262]">{invoice.status} / {invoice.invoiceNumber}</p>
            <h2 className="mt-3 text-xl font-semibold text-white">{invoice.order.product?.name || "MxF Labs product"}</h2>
            <div className="mt-4 grid gap-2 text-sm text-white/54 md:grid-cols-3">
              <p>Subtotal: {money(invoice.amountCents, invoice.currency)}</p>
              <p>Tax: {money(invoice.taxCents, invoice.currency)}</p>
              <p>Total: {money(invoice.totalCents, invoice.currency)}</p>
            </div>
          </article>
        ))}
        {!invoices.length ? (
          <EmptyState
            icon={ReceiptText}
            title="No invoices yet."
            description="Invoices and receipts appear after a purchase has been fulfilled."
            action={{ label: "View orders", href: "/portal/orders" }}
          />
        ) : null}
      </div>
    </PortalShell>
  );
}
