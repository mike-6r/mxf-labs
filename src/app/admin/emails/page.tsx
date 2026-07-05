import { AdminShell } from "@/components/admin/admin-shell";
import { EmailTemplateManager } from "@/components/admin/email-template-manager";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";
import { getSettings } from "@/lib/db/settings";
import { editableEmailTemplates, emailTemplateKey } from "@/lib/email/template-definitions";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  const admin = await requireAdminPage("emails.manage");
  const [deliveries, settings] = await Promise.all([
    prisma.emailDelivery.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    getSettings(editableEmailTemplates.flatMap((template) => [
      emailTemplateKey(template.id, "subject"),
      emailTemplateKey(template.id, "body"),
    ])),
  ]);

  return (
    <AdminShell
      title="Emails"
      description="Resend delivery log for receipts, licenses, support updates, product updates, invoices, and account messages."
      adminEmail={admin.email}
    >
      <EmailTemplateManager settings={settings} />

      <section className="mt-6 surface rounded-lg p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="text-xl font-semibold text-white">Delivery Queue</h2>
            <p className="mt-2 text-sm text-white/50">
              Provider status: {process.env.RESEND_API_KEY ? "Configured" : "Awaiting RESEND_API_KEY"}
            </p>
          </div>
          <p className="font-mono text-xs text-[#ff6262]">{deliveries.length} recent records</p>
        </div>
        <div className="mt-5 grid gap-3">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="rounded-md border border-white/8 bg-white/[0.035] p-4">
              <p className="font-mono text-xs text-[#ff6262]">{delivery.status} / {delivery.template}</p>
              <p className="mt-2 text-sm font-semibold text-white">{delivery.subject}</p>
              <p className="mt-1 text-xs text-white/42">{delivery.toEmail} / {delivery.createdAt.toLocaleString()}</p>
              {delivery.error ? <p className="mt-2 text-xs text-[#ff9eb8]">{delivery.error}</p> : null}
            </div>
          ))}
          {!deliveries.length ? <p className="text-sm text-white/46">Email delivery records appear here after local workflows send or queue messages.</p> : null}
        </div>
      </section>
    </AdminShell>
  );
}
