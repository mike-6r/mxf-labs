import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth/page";
import { parseJsonArray } from "@/lib/db/serializers";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const permissions = [
  "Products",
  "Orders",
  "Licenses",
  "Customers",
  "Support",
  "Analytics",
  "Discord",
  "Emails",
  "Payments",
  "Downloads",
  "Logs",
  "Audit",
  "Feature Flags",
  "Documentation",
  "Settings",
];

export default async function AdminTeamPage() {
  const admin = await requireAdminPage("team.manage");
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <AdminShell
      title="Team"
      description="RBAC foundation for owner, admin, developer, support, and moderator workflows."
      adminEmail={admin.email}
    >
      <div className="grid gap-6">
        <section className="surface rounded-lg p-5">
          <h2 className="text-xl font-semibold text-white">Permission matrix</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {permissions.map((permission) => (
              <div key={permission} className="rounded-md border border-white/8 bg-white/[0.035] p-4">
                <p className="font-semibold text-white">{permission}</p>
                <p className="mt-2 text-xs leading-5 text-white/44">Enforced by module guards on admin pages and APIs.</p>
              </div>
            ))}
          </div>
        </section>
        {users.map((user) => (
          <article key={user.id} className="surface rounded-lg p-5">
            <p className="font-mono text-xs text-[#ff6262]">{user.role}</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{user.name}</h2>
            <p className="mt-1 text-sm text-white/48">{user.email}</p>
            <p className="mt-4 text-xs text-white/42">Permissions: {parseJsonArray(user.permissionsJson).join(", ") || "Role defaults"}</p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
