import { AdminShell } from "@/components/admin/admin-shell";
import { ContactManager } from "@/components/admin/resource-managers";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
  const admin = await requireAdminPage("contacts.manage");
  const submissions = await prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AdminShell
      title="Contact submissions"
      description="View inquiries, mark read or archived, add notes, and keep lead follow-up organized."
      adminEmail={admin.email}
    >
      <ContactManager submissions={JSON.parse(JSON.stringify(submissions))} />
    </AdminShell>
  );
}
