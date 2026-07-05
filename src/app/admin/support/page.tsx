import { AdminShell } from "@/components/admin/admin-shell";
import { SupportInboxManager } from "@/components/admin/support-inbox-manager";
import { requireAdminPage } from "@/lib/auth/page";
import { getContentMode, isDemoText, shouldShowDemoData } from "@/lib/content-mode";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const admin = await requireAdminPage("support.manage");
  const [tickets, contentMode] = await Promise.all([
    prisma.supportTicket.findMany({
      include: { relatedProduct: true, relatedLicense: true, notes: { orderBy: { createdAt: "desc" } } },
      orderBy: { updatedAt: "desc" },
    }),
    getContentMode(),
  ]);
  const visibleTickets = shouldShowDemoData(contentMode)
    ? tickets
    : tickets.filter((ticket) => !isDemoText(ticket.email, ticket.discordUsername, ticket.subject, ticket.message, ticket.internalNotes));

  return (
    <AdminShell
      title="Support"
      description={`Inbox-style triage for customer tickets. Content mode: ${contentMode}.`}
      adminEmail={admin.email}
    >
      <SupportInboxManager tickets={JSON.parse(JSON.stringify(visibleTickets))} />
    </AdminShell>
  );
}
