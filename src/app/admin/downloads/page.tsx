import { AdminShell } from "@/components/admin/admin-shell";
import { DeliveryManager } from "@/components/admin/delivery-manager";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDownloadsPage() {
  const admin = await requireAdminPage("downloads.manage");
  const [products, docs, releases, downloads, events, tokens] = await Promise.all([
    prisma.product.findMany({ select: { id: true, name: true, slug: true, version: true }, orderBy: { name: "asc" } }),
    prisma.documentationArticle.findMany({
      include: { product: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.productRelease.findMany({
      include: { product: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ isLatest: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.productDownload.findMany({
      include: {
        product: { select: { id: true, name: true, slug: true } },
        release: { select: { id: true, title: true, version: true, productId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.downloadEvent.findMany({
      include: {
        customer: { select: { email: true } },
        download: { select: { filename: true, product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.downloadToken.findMany({
      include: {
        customer: { select: { email: true } },
        download: { select: { filename: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <AdminShell
      title="Downloads"
      description="Private product files, one-time temporary tokens, customer download history, and denied access attempts."
      adminEmail={admin.email}
    >
      <DeliveryManager
        products={products}
        docs={docs.map((doc) => ({
          ...doc,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
        }))}
        releases={releases.map((release) => ({
          ...release,
          publishedAt: release.publishedAt?.toISOString() || null,
          createdAt: release.createdAt.toISOString(),
          updatedAt: release.updatedAt.toISOString(),
        }))}
        downloads={downloads.map((download) => ({
          ...download,
          createdAt: download.createdAt.toISOString(),
          updatedAt: download.updatedAt.toISOString(),
        }))}
        events={events.map((event) => ({
          ...event,
          createdAt: event.createdAt.toISOString(),
        }))}
        tokens={tokens.map((token) => ({
          ...token,
          expiresAt: token.expiresAt.toISOString(),
          usedAt: token.usedAt?.toISOString() || null,
          createdAt: token.createdAt.toISOString(),
        }))}
        initialTab="downloads"
        enabledTabs={["downloads", "activity"]}
      />
    </AdminShell>
  );
}
