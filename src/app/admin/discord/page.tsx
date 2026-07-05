import type { LucideIcon } from "lucide-react";
import { Activity, Bot, Radio, Server, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth/page";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDiscordPage() {
  const admin = await requireAdminPage("discord.manage");
  const [linkedCustomers, servers, syncEvents, heartbeat, botLogs, queuedSync] = await Promise.all([
    prisma.customer.findMany({
      where: { discordId: { not: null } },
      orderBy: { discordLastSyncedAt: "desc" },
      take: 12,
    }),
    prisma.discordServer.findMany({
      include: { linkedCustomer: true, linkedLicense: true, product: true },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.activityLog.findMany({
      where: { entityType: "Discord" },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.botHeartbeat.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.botLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.botSyncQueue.count({ where: { status: "Queued" } }),
  ]);
  const botOnline = heartbeat?.status === "Online";
  const hasBotApiKey = [process.env.MXF_BOT_API_KEY, process.env.DISCORD_BOT_API_KEY].some(
    (key) => key?.trim() && key.trim() !== "replace-with-a-private-bot-api-key",
  );

  return (
    <AdminShell
      title="Discord"
      description="Customer identity, server linking, bot API readiness, and Discord sync history."
      adminEmail={admin.email}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Linked customers" value={linkedCustomers.length} icon={Users} />
        <Stat label="Linked servers" value={servers.length} icon={Server} />
        <Stat label="Bot API" value={hasBotApiKey ? "Configured" : "Awaiting key"} icon={Bot} />
        <Stat label="Bot status" value={botOnline ? "Online" : heartbeat?.status || "No heartbeat"} icon={Radio} />
        <Stat label="Bot commands" value={heartbeat?.commandCount || 0} icon={Activity} />
        <Stat label="Queued sync" value={queuedSync} icon={Activity} />
      </div>

      <section className="surface mt-6 rounded-lg p-5">
        <h2 className="text-xl font-semibold text-white">Bot Heartbeat</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Item title="Status" meta={heartbeat ? `${heartbeat.status} / ${heartbeat.createdAt.toLocaleString()}` : "No heartbeat received"} />
          <Item title="Guilds" meta={String(heartbeat?.guildCount || 0)} />
          <Item title="Latency" meta={`${heartbeat?.latencyMs || 0}ms`} />
          <Item title="Website API" meta={heartbeat?.websiteApiStatus || "Unknown"} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Discord Customers">
          {linkedCustomers.map((customer) => (
            <Item
              key={customer.id}
              title={customer.discordGlobalName || customer.discordUsername || customer.name}
              meta={`${customer.discordId} / ${customer.discordSyncStatus}`}
            />
          ))}
        </Panel>
        <Panel title="Server Links">
          {servers.map((server) => (
            <Item
              key={server.id}
              title={server.serverName}
              meta={`${server.product?.name || "No product"} / ${server.linkedCustomer?.email || "No customer"} / ${server.linkedLicense?.status || "No license"}`}
            />
          ))}
        </Panel>
      </div>

      <section className="surface mt-6 rounded-lg p-5">
        <h2 className="text-xl font-semibold text-white">Sync Events</h2>
        <div className="mt-5 grid gap-3">
          {syncEvents.map((event) => (
            <Item key={event.id} title={event.action} meta={`${event.actorEmail || "system"} / ${event.createdAt.toLocaleString()}`} />
          ))}
        </div>
      </section>

      <section className="surface mt-6 rounded-lg p-5">
        <h2 className="text-xl font-semibold text-white">Bot Logs</h2>
        <div className="mt-5 grid gap-3">
          {botLogs.map((log) => (
            <Item key={log.id} title={`${log.area}: ${log.action}`} meta={`${log.severity} / ${log.createdAt.toLocaleString()}`} />
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <article className="surface rounded-lg p-5">
      <Icon className="h-5 w-5 text-[#ff6262]" aria-hidden="true" />
      <p className="mt-5 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-white/50">{label}</p>
    </article>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface rounded-lg p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-5 grid gap-3">{children}</div>
    </section>
  );
}

function Item({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.035] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-white/42">{meta}</p>
    </div>
  );
}
