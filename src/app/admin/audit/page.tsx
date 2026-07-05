import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const admin = await requireAdminPage("audit.read");
  const auditEvents = await prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 80 });

  return (
    <AdminShell
      title="Audit Trail"
      description="Security-relevant admin and system events with actor, entity, timestamp, and metadata."
      adminEmail={admin.email}
    >
      <section className="surface rounded-lg p-5">
        <div className="grid gap-3">
          {auditEvents.map((event) => (
            <div key={event.id} className="rounded-md border border-white/8 bg-white/[0.035] p-4">
              <p className="font-mono text-xs text-[#ff6262]">{event.entityType} / {event.entityId || "no entity"}</p>
              <h2 className="mt-2 text-sm font-semibold text-white">{event.action}</h2>
              <p className="mt-1 text-xs text-white/42">{event.actorEmail || "system"} / {event.createdAt.toLocaleString()}</p>
              <pre className="mt-3 max-h-36 overflow-auto rounded-md bg-black/25 p-3 text-xs text-white/48">{event.metadata}</pre>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
