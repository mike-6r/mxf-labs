import { AdminShell } from "@/components/admin/admin-shell";
import { AnnouncementManager } from "@/components/admin/resource-managers";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const admin = await requireAdminPage("announcements.manage");
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <AdminShell
      title="Announcements"
      description="Publish public updates, maintenance notices, releases, alerts, and admin-only notes."
      adminEmail={admin.email}
    >
      <AnnouncementManager announcements={JSON.parse(JSON.stringify(announcements))} />
    </AdminShell>
  );
}
