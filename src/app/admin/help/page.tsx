import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth/page";

export const dynamic = "force-dynamic";

const modules = [
  ["Products", "Manage public product records, pricing, docs, releases, roadmap, FAQ, and future checkout buttons.", "Owner/Admin", "Stripe, PayPal, downloads, changelog"],
  ["Customers", "Review customer identity, Discord account, orders, licenses, revenue, support, and activity logs.", "Owner/Admin/Support", "Customer portal and Discord sync"],
  ["Orders", "Track checkout state, provider IDs, discounts, refunds, and fulfillment status.", "Owner/Admin", "Stripe and PayPal webhooks"],
  ["Licenses", "Generate, suspend, revoke, reset, and inspect keys used by bots, plugins, web apps, and SaaS products.", "Owner/Admin/Developer", "Activation telemetry and product runtimes"],
  ["Support", "Triage tickets with linked products, linked licenses, attachments, notes, status, and timeline.", "Owner/Admin/Support", "Email and Discord replies"],
  ["Analytics", "Review revenue, customers, orders, license validations, downloads, conversion, and support volume.", "Owner/Admin", "Dashboards and trend charts"],
  ["Documentation", "Maintain setup guides, API docs, release notes, changelog entries, and product delivery records.", "Owner/Admin/Developer", "Markdown editing and file storage"],
  ["Team", "Manage roles and future permission scopes across product, order, license, support, analytics, and docs modules.", "Owner", "Fine-grained RBAC enforcement"],
];

export default async function AdminHelpPage() {
  const admin = await requireAdminPage("dashboard.read");

  return (
    <AdminShell
      title="Admin Help"
      description="Built-in operating manual for each MxF Labs admin module."
      adminEmail={admin.email}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map(([module, purpose, permissions, future]) => (
          <article key={module} className="surface rounded-lg p-5">
            <p className="font-mono text-xs text-[#ff6262]">{permissions}</p>
            <h2 className="mt-3 text-xl font-semibold text-white">{module}</h2>
            <p className="mt-2 text-sm leading-6 text-white/56">{purpose}</p>
            <p className="mt-4 rounded-md border border-white/8 bg-white/[0.035] p-3 text-xs leading-5 text-white/42">
              Future integrations: {future}
            </p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
