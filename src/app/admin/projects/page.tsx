import { AdminShell } from "@/components/admin/admin-shell";
import { ProjectAdminManager } from "@/components/admin/project-admin-manager";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const admin = await requireAdminPage("projects.manage");
  const projects = await prisma.project.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <AdminShell
      title="Projects"
      description="Manage public portfolio work, featured flags, tech stacks, case studies, links, and private repo labels."
      adminEmail={admin.email}
    >
      <ProjectAdminManager projects={JSON.parse(JSON.stringify(projects))} />
    </AdminShell>
  );
}
