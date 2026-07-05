import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDocumentationPage() {
  const admin = await requireAdminPage("documentation.manage");
  const [docs, releases, downloads] = await Promise.all([
    prisma.documentationArticle.findMany({ include: { product: true }, orderBy: { updatedAt: "desc" } }),
    prisma.productRelease.findMany({ include: { product: true }, orderBy: { createdAt: "desc" } }),
    prisma.productDownload.findMany({ include: { product: true, release: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <AdminShell
      title="Documentation & Delivery"
      description="Admin-editable docs, product releases, assigned downloads, versions, and changelog-linked delivery structure."
      adminEmail={admin.email}
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Documentation">
          {docs.map((doc) => (
            <Item key={doc.id} title={doc.title} meta={`${doc.category} / ${doc.product?.name || "Platform"}`} />
          ))}
        </Panel>
        <Panel title="Releases">
          {releases.map((release) => (
            <Item key={release.id} title={release.title} meta={`${release.product.name} / v${release.version} / ${release.status}`} />
          ))}
        </Panel>
        <Panel title="Downloads">
          {downloads.map((download) => (
            <Item key={download.id} title={download.filename} meta={`${download.product.name} / ${download.fileType} / ${download.storageKey}`} />
          ))}
        </Panel>
      </div>
    </AdminShell>
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
