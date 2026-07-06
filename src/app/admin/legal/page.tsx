import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { CustomizeManager } from "@/components/admin/customize-manager";
import { requireAdminPage } from "@/lib/auth/page";
import { getSettings } from "@/lib/db/settings";

export const dynamic = "force-dynamic";

const legalKeys = ["legal.terms", "legal.privacy", "legal.refunds", "legal.support_sla"];

const policyLinks = [
  { label: "Terms", href: "/terms", description: "Public terms of service page." },
  { label: "Privacy", href: "/privacy", description: "Public privacy policy page." },
  { label: "Refunds", href: "/refunds", description: "Public refund policy page." },
];

export default async function AdminLegalPage() {
  const admin = await requireAdminPage("settings.manage");
  const settings = await getSettings(legalKeys);
  const missing = legalKeys.filter((key) => !settings[key]?.trim());

  return (
    <AdminShell
      title="Legal"
      description="Edit public policy copy and support terms used across checkout, products, refunds, and customer support."
      adminEmail={admin.email}
    >
      <div className="grid gap-6">
        <section className="surface rounded-lg p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Policy status</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Production legal copy</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/52">
                These fields power the public legal pages. Keep them concise, reviewed, and launch-ready before enabling paid checkout.
              </p>
            </div>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/70">
              {missing.length ? `${missing.length} fields need copy` : "All legal fields filled"}
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {policyLinks.map((item) => (
              <Link key={item.href} href={item.href} target="_blank" className="rounded-md border border-white/10 bg-black/24 p-4 transition hover:border-[#ff6262]/35">
                <p className="font-semibold text-white">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-white/46">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <CustomizeManager settings={settings} products={[]} initialSection="legal" allowedSections={["legal"]} />
      </div>
    </AdminShell>
  );
}
