import { AdminShell } from "@/components/admin/admin-shell";
import { ProductAdminManager } from "@/components/admin/product-admin-manager";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const admin = await requireAdminPage("products.manage");
  const products = await prisma.product.findMany({
    include: {
      _count: {
        select: {
          downloads: true,
          documentation: true,
          releases: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AdminShell
      title="Products"
      description="Manage product content, pricing, media, layout templates, CTAs, roadmap, docs, licensing, and SEO from one source of truth."
      adminEmail={admin.email}
    >
      <ProductAdminManager products={JSON.parse(JSON.stringify(products))} />
    </AdminShell>
  );
}
