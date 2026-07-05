import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const admin = await requireAdminPage("logs.read");
  const [activity, customerActivity, logins] = await Promise.all([
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.customerActivity.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.customerLoginEvent.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  return (
    <AdminShell
      title="Logs"
      description="Operational logs for admins, customers, login events, webhooks, Discord sync, and support workflows."
      adminEmail={admin.email}
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="System Activity">
          {activity.map((event) => (
            <Item key={event.id} title={event.action} meta={`${event.entityType} / ${event.actorEmail || "system"} / ${event.createdAt.toLocaleString()}`} />
          ))}
        </Panel>
        <Panel title="Customer Activity">
          {customerActivity.map((event) => (
            <Item key={event.id} title={event.action} meta={`${event.customer?.email || "Unknown customer"} / ${event.entityType} / ${event.createdAt.toLocaleString()}`} />
          ))}
        </Panel>
        <Panel title="Login History">
          {logins.map((event) => (
            <Item key={event.id} title={`${event.provider} ${event.status}`} meta={`${event.customer?.email || "Unknown customer"} / ${event.ipAddress || "No IP"} / ${event.createdAt.toLocaleString()}`} />
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
