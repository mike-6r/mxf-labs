import { FeatureFlagsManager } from "@/components/admin/feature-flags-manager";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminFeatureFlagsPage() {
  const admin = await requireAdminPage("feature_flags.manage");
  const flags = await prisma.featureFlag.findMany({ orderBy: [{ scope: "asc" }, { key: "asc" }] });

  return (
    <AdminShell
      title="Feature Flags"
      description="Configurable rollout controls for subscriptions, beta downloads, Discord role sync, and future platform capabilities."
      adminEmail={admin.email}
    >
      <FeatureFlagsManager flags={JSON.parse(JSON.stringify(flags))} />
    </AdminShell>
  );
}
