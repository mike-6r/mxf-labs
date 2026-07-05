import { Bell } from "lucide-react";
import { PortalShell, PortalSignIn } from "@/components/portal/portal-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal Notifications | MxF Labs" };

export default async function PortalNotificationsPage() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <PortalShell title="Notifications" description="Sign in to view product and account updates." customer={null}>
        <PortalSignIn />
      </PortalShell>
    );
  }

  const notifications = await prisma.customerNotification.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" } });

  return (
    <PortalShell title="Notifications." description="Purchase, license, support, release, and announcement notices." customer={customer}>
      <div className="grid gap-4">
        {notifications.map((notification) => (
          <article key={notification.id} className="surface rounded-lg p-5">
            <p className="font-mono text-xs text-[#ff6262]">{notification.type}</p>
            <h2 className="mt-3 text-xl font-semibold text-white">{notification.title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/54">{notification.body}</p>
          </article>
        ))}
        {!notifications.length ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet."
            description="Product updates, support replies, license alerts, and purchase notices will appear here."
            action={{ label: "Back to dashboard", href: "/portal" }}
          />
        ) : null}
      </div>
    </PortalShell>
  );
}
