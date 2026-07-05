import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSuspiciousPage() {
  const admin = await requireAdminPage("licenses.manage");
  const flags = await prisma.suspiciousActivityFlag.findMany({
    include: { customer: true, product: true, license: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell
      title="Suspicious Activity"
      description="Manual review queue for anti-sharing and abnormal validation/download behavior. Nothing is revoked automatically."
      adminEmail={admin.email}
    >
      <div className="grid gap-4">
        {flags.map((flag) => (
          <article key={flag.id} className="surface rounded-lg p-5">
            <p className="font-mono text-xs text-[#ff6262]">{flag.severity} / {flag.status}</p>
            <h2 className="mt-3 text-xl font-semibold text-white">{flag.reason}</h2>
            <p className="mt-2 text-sm text-white/52">
              {flag.customer?.email || "Unknown customer"} / {flag.product?.name || "Unknown product"} / {flag.license?.key || "No license"}
            </p>
            <pre className="mt-4 overflow-x-auto rounded-md border border-white/8 bg-black/24 p-4 text-xs text-white/48">{flag.metadata}</pre>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
