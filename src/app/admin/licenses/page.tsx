import { AdminShell } from "@/components/admin/admin-shell";
import { LicenseManager } from "@/components/admin/resource-managers";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminLicensesPage() {
  const admin = await requireAdminPage("licenses.manage");
  const [licenses, products, customers] = await Promise.all([
    prisma.license.findMany({
      include: { customer: true, product: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.customer.findMany({ orderBy: { email: "asc" } }),
  ]);

  return (
    <AdminShell
      title="Licenses"
      description="Create, suspend, revoke, and validate license keys for future external product checks."
      adminEmail={admin.email}
    >
      <LicenseManager
        licenses={JSON.parse(JSON.stringify(licenses))}
        products={products.map((product) => ({ value: product.id, label: product.name }))}
        customers={customers.map((customer) => ({ value: customer.id, label: customer.email }))}
      />
    </AdminShell>
  );
}
