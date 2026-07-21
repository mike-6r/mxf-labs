import { Bug, CreditCard, KeyRound, LifeBuoy, MessageSquarePlus, PackageCheck, PenTool } from "lucide-react";
import Link from "next/link";
import { PortalShell, PortalSignIn } from "@/components/portal/portal-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { getContentMode } from "@/lib/content-mode";
import { prisma } from "@/lib/db/prisma";
import { visibleSupportTickets } from "@/lib/support/visibility";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal Support | MxF Labs" };

const ticketTypes = [
  { label: "General", icon: LifeBuoy, href: "/support" },
  { label: "Product", icon: PackageCheck, href: "/support" },
  { label: "License", icon: KeyRound, href: "/support" },
  { label: "Purchase", icon: CreditCard, href: "/support" },
  { label: "Bug", icon: Bug, href: "/support" },
  { label: "Custom order", icon: PenTool, href: "/contact" },
];

export default async function PortalSupportPage() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <PortalShell title="Support" description="Sign in to view your support ticket history." customer={null}>
        <PortalSignIn />
      </PortalShell>
    );
  }

  const [ticketsRaw, contentMode] = await Promise.all([
    prisma.supportTicket.findMany({
      where: { customerId: customer.id },
      include: { relatedProduct: true, relatedLicense: true, notes: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    getContentMode(),
  ]);

  const tickets = visibleSupportTickets(ticketsRaw, contentMode);
  const openTickets = tickets.filter((ticket) => !["Resolved", "Closed"].includes(ticket.status));

  return (
    <PortalShell
      title="Support desk."
      description="A guided place for tickets, license resets, product questions, purchase issues, bugs, and custom order follow-up."
      customer={customer}
    >
      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="surface-strong rounded-lg p-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Create ticket</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Start with the right support path.</h2>
          <p className="mt-3 text-sm leading-7 text-white/56">
            Choose the request type first, then include product, license, expected behavior, logs, and urgency on the support form.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {ticketTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Link key={type.label} href={type.href} className="group flex min-h-12 items-center gap-3 rounded-md border border-white/8 bg-white/[0.035] px-3 text-sm font-semibold text-white/66 transition hover:border-[#ff6262]/35 hover:text-white">
                  <Icon className="h-4 w-4 text-[#ff6262]" aria-hidden="true" />
                  {type.label}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="surface rounded-lg p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Ticket health</h2>
              <p className="mt-2 text-sm text-white/50">{openTickets.length} open / {tickets.length} total</p>
            </div>
            <Link className="button-shine inline-flex min-h-10 w-fit items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black" href="/support">
              <MessageSquarePlus className="relative z-10 h-4 w-4" aria-hidden="true" />
              <span className="relative z-10">Create ticket</span>
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="Open tickets" value={String(openTickets.length)} />
            <Metric label="Last ticket" value={tickets[0]?.createdAt.toLocaleDateString() || "None"} />
            <Metric label="Linked Discord" value={customer.discordUsername || "Not linked"} />
          </div>
        </section>
      </div>

      <section className="mt-5">
        {tickets.length ? (
          <div className="grid gap-4">
            {tickets.map((ticket) => {
              const latestNote = ticket.notes[0];
              return (
                <article key={ticket.id} className="surface rounded-lg p-5">
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">{ticket.ticketNumber} / {ticket.priority}</p>
                      <h2 className="mt-3 text-xl font-semibold text-white">{ticket.subject}</h2>
                      <p className="mt-2 text-sm leading-6 text-white/52">{ticket.message}</p>
                    </div>
                    <span className="w-fit rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/64">{ticket.status}</span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric label="Linked product" value={ticket.relatedProduct?.name || "General"} />
                    <Metric label="Linked license" value={ticket.relatedLicense ? maskLicense(ticket.relatedLicense.key) : "Not linked"} />
                    <Metric label="Last response" value={latestNote?.createdAt.toLocaleDateString() || "Awaiting response"} />
                    <Metric label="Updated" value={ticket.updatedAt.toLocaleDateString()} />
                  </div>
                  {latestNote ? (
                    <p className="mt-4 rounded-md border border-white/8 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-white/48">
                      {latestNote.author}: {latestNote.body}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={LifeBuoy}
            title="No support tickets yet."
            description="When you open a product, license, purchase, bug, or custom order ticket, the history and status appear here."
            action={{ label: "Create ticket", href: "/support" }}
          />
        )}
      </section>
    </PortalShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.03] p-3">
      <p className="text-xs text-white/36">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function maskLicense(key: string) {
  if (key.length <= 8) return "Hidden";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
