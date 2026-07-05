import { PortalShell, PortalSignIn } from "@/components/portal/portal-shell";
import { getCurrentCustomer } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Discord Settings | MxF Labs" };

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function PortalDiscordSettingsPage({ searchParams }: PageProps) {
  const customer = await getCurrentCustomer();
  const status = (await searchParams)?.status;

  if (!customer) {
    return (
      <PortalShell title="Discord settings" description="Sign in to connect a Discord identity." customer={null}>
        <PortalSignIn status={typeof status === "string" ? status : undefined} />
      </PortalShell>
    );
  }

  return (
    <PortalShell title="Discord settings." description="Discord is the primary identity layer for ownership, support verification, and future bot integrations." customer={customer}>
      <section className="surface rounded-lg p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[#ff6262]/30 bg-[#ff6262]/10 text-xl font-semibold text-[#ffd8d8]">
            {initials(customer.discordGlobalName || customer.name)}
          </div>
          <div>
            <p className="font-mono text-xs text-[#ff6262]">{customer.discordSyncStatus}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{customer.discordGlobalName || customer.name}</h2>
            <p className="mt-1 text-sm text-white/54">@{customer.discordUsername || "not-linked"}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Info label="Discord ID" value={customer.discordId || "Not connected"} />
          <Info label="Discord Email" value={customer.discordEmail || "Not synced"} />
          <Info label="Linked Date" value={customer.discordLinkedAt?.toLocaleString() || "Not linked"} />
          <Info label="Last Sync" value={customer.discordLastSyncedAt?.toLocaleString() || "Not synced"} />
        </div>
        {status === "discord_not_configured" ? (
          <p className="mt-5 rounded-md border border-[#f7b955]/20 bg-[#f7b955]/8 px-4 py-3 text-sm text-[#ffe1a3]">
            Discord OAuth is not configured yet. Add Discord credentials to `.env` to enable live account linking.
          </p>
        ) : null}
        <a
          href="/api/auth/discord/start?mode=link&returnTo=/portal/settings/discord"
          className="mt-6 inline-flex min-h-11 items-center rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10 px-4 text-sm font-semibold text-[#ffd8d8]"
        >
          Reconnect Discord
        </a>
      </section>
    </PortalShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.035] p-4">
      <p className="text-xs text-white/34">{label}</p>
      <p className="mt-2 break-all text-sm text-white/70">{value}</p>
    </div>
  );
}
