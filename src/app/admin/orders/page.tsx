import { AdminShell } from "@/components/admin/admin-shell";
import { OrderManager } from "@/components/admin/resource-managers";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const admin = await requireAdminPage("orders.manage");
  const [orders, products, customers] = await Promise.all([
    prisma.order.findMany({
      include: { customer: true, product: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.customer.findMany({ orderBy: { email: "asc" } }),
  ]);

  return (
    <AdminShell
      title="Orders"
      description="Create, edit, delete, and review Stripe-ready order records, purchase intents, and status history."
      adminEmail={admin.email}
    >
      <section className="surface rounded-lg p-5">
        <div className="mb-5 rounded-md border border-[#f7b955]/20 bg-[#f7b955]/8 p-4 text-sm leading-6 text-[#ffe1a3]">
          Manual paid orders use the same fulfillment path as provider webhooks: order record, invoice, license, notification, and email delivery log.
        </div>
        <OrderManager
          orders={JSON.parse(JSON.stringify(orders))}
          products={products.map((product) => ({ value: product.id, label: product.name }))}
          customers={customers.map((customer) => ({ value: customer.id, label: customer.email }))}
        />
      </section>
    </AdminShell>
  );
}
