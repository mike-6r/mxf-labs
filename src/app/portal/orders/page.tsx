import { ShoppingBag } from "lucide-react";
import { PortalShell, PortalSignIn } from "@/components/portal/portal-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal Orders | MxF Labs" };

export default async function PortalOrdersPage() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <PortalShell title="Orders" description="Sign in to view purchase history." customer={null}>
        <PortalSignIn />
      </PortalShell>
    );
  }

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PortalShell title="Order history." description="One-time purchases, provider references, coupons, discounts, and fulfillment status." customer={customer}>
      <div className="grid gap-4">
        {orders.map((order) => (
          <article key={order.id} className="surface rounded-lg p-5">
            <p className="font-mono text-xs text-[#ff6262]">{order.provider} / {order.status}</p>
            <h2 className="mt-3 text-xl font-semibold text-white">{order.product?.name || "Product"}</h2>
            <p className="mt-2 text-sm text-white/54">
              {order.currency} {(order.amountCents / 100).toFixed(2)} / {order.providerOrderId || "manual order"}
            </p>
          </article>
        ))}
        {!orders.length ? (
          <EmptyState
            icon={ShoppingBag}
            title="No orders yet."
            description="Purchases, invoices, and fulfilled product access will appear here."
            action={{ label: "Browse products", href: "/products" }}
          />
        ) : null}
      </div>
    </PortalShell>
  );
}
