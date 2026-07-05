import { AdminShell } from "@/components/admin/admin-shell";
import { ContentModeControl } from "@/components/admin/content-mode-control";
import { SettingsManager } from "@/components/admin/settings-manager";
import { requireAdminPage } from "@/lib/auth/page";
import { getContentMode } from "@/lib/content-mode";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = await requireAdminPage("settings.manage");
  const [settings, contentMode] = await Promise.all([
    prisma.platformSetting.findMany({ orderBy: { key: "asc" } }),
    getContentMode(),
  ]);

  return (
    <AdminShell
      title="Settings"
      description="Owner-controlled platform settings for support SLA, refund text, storage, contact, and social links."
      adminEmail={admin.email}
    >
      <div className="mb-6">
        <ContentModeControl mode={contentMode} />
      </div>
      <SettingsManager settings={JSON.parse(JSON.stringify(settings))} />
    </AdminShell>
  );
}
