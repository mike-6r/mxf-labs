import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDownloadsPage() {
  const admin = await requireAdminPage("downloads.manage");
  const [downloads, events, tokens] = await Promise.all([
    prisma.productDownload.findMany({ include: { product: true, release: true }, orderBy: { createdAt: "desc" } }),
    prisma.downloadEvent.findMany({ include: { customer: true, download: { include: { product: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.downloadToken.findMany({ include: { customer: true, download: true }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  return (
    <AdminShell
      title="Downloads"
      description="Private product files, one-time temporary tokens, customer download history, and denied access attempts."
      adminEmail={admin.email}
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Product Files">
          {downloads.map((download) => (
            <Item key={download.id} title={download.filename} meta={`${download.product.name} / v${download.version} / ${download.fileType}`} />
          ))}
        </Panel>
        <Panel title="Download Events">
          {events.map((event) => (
            <Item key={event.id} title={event.status} meta={`${event.download?.product.name || "Product"} / ${event.customer?.email || "Anonymous"} / ${event.createdAt.toLocaleString()}`} />
          ))}
        </Panel>
        <Panel title="Temporary Tokens">
          {tokens.map((token) => (
            <Item key={token.id} title={token.usedAt ? "Used" : "Active"} meta={`${token.customer?.email || "No customer"} / expires ${token.expiresAt.toLocaleString()}`} />
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
