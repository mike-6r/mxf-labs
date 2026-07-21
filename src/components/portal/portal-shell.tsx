import {
  Bell,
  Download,
  KeyRound,
  LifeBuoy,
  LogIn,
  PackageCheck,
  Settings,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/layout/logo";
import { getContentMode } from "@/lib/content-mode";

const portalNav = [
  { label: "Dashboard", href: "/portal", icon: UserRound },
  { label: "Products", href: "/portal/products", icon: PackageCheck },
  { label: "Licenses", href: "/portal/licenses", icon: KeyRound },
  { label: "Downloads", href: "/portal/downloads", icon: Download },
  { label: "Support", href: "/portal/support", icon: LifeBuoy },
  { label: "Settings", href: "/portal/settings", icon: Settings },
];

const secondaryLinks = [
  { label: "Orders", href: "/portal/orders" },
  { label: "Invoices", href: "/portal/invoices" },
  { label: "Activity", href: "/portal/activity" },
  { label: "Notifications", href: "/portal/notifications" },
];

export function PortalShell({
  children,
  title,
  description,
  customer,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  customer: { name: string; email: string; discordUsername?: string | null } | null;
}) {
  return (
    <div className="min-h-screen px-5 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="surface mb-6 rounded-lg p-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3 px-1">
              <LogoMark />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">MxF Customer Portal</p>
                <p className="truncate text-xs text-white/44">{customer?.discordUsername || "Discord-first access"}</p>
              </div>
            </div>
            <nav className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:flex lg:items-center">
              {portalNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/8 bg-white/[0.035] px-2 text-xs font-semibold text-white/62 transition hover:border-[#ff6262]/35 hover:text-white lg:px-3"
                  >
                    <Icon className="h-4 w-4 text-[#ff6262]" aria-hidden="true" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <main className="min-w-0">
          <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff6262]">Customer command center</p>
              <h1 className="mt-3 text-balance text-3xl font-semibold text-white md:text-5xl">{title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/58">{description}</p>
            </div>
            {customer ? (
              <div className="surface rounded-lg p-4 lg:min-w-64">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#ff6262]/20 bg-[#ff6262]/10 text-sm font-semibold text-[#ffd8d8]">
                    {customer.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{customer.name}</p>
                    <p className="truncate text-xs text-white/42">{customer.email}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {children}

          {customer ? (
            <div className="mt-8 flex flex-wrap gap-2 border-t border-white/8 pt-5">
              {secondaryLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/48 transition hover:border-[#ff6262]/30 hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export async function PortalSignIn({ status }: { status?: string }) {
  const contentMode = await getContentMode();
  const localLoginEnabled = contentMode === "demo" && (process.env.NODE_ENV !== "production" || process.env.MOCK_PROVIDERS_ENABLED === "true");

  return (
    <section className="surface-strong relative overflow-hidden rounded-lg p-6 md:p-8">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6262]/60 to-transparent" />
      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[#ff6262]/20 bg-[#ff6262]/10 text-[#ff6262]">
        <LogIn className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.24em] text-[#ff6262]">Discord Identity</p>
      <h2 className="mt-3 max-w-2xl text-3xl font-semibold text-white md:text-4xl">Sign in to unlock products, licenses, downloads, and support.</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58">
        Your Discord identity connects ownership, license status, downloads, server links, and support tickets in one customer view.
      </p>
      {status === "discord_not_configured" ? (
        <p className="mt-5 rounded-md border border-[#f7b955]/20 bg-[#f7b955]/8 px-4 py-3 text-sm text-[#ffe1a3]">
          Discord sign-in is not available yet. Open support if you need access while the customer portal is being prepared.
        </p>
      ) : null}
      {status === "admin_discord_required" ? (
        <p className="mt-5 rounded-md border border-[#ff6262]/20 bg-[#ff6262]/8 px-4 py-3 text-sm text-[#ffd8d8]">
          That Discord account is signed in as a customer, but it is not configured for admin access.
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/api/auth/discord/start"
          className="button-shine inline-flex min-h-11 items-center rounded-md bg-white px-4 text-sm font-semibold text-black transition hover:bg-[#fff0ed]"
        >
          Continue with Discord
        </a>
        {localLoginEnabled ? (
          <a
            href="/api/auth/mock-discord"
            className="inline-flex min-h-11 items-center rounded-md border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:border-[#ff6262]/38"
          >
            Use local demo login
          </a>
        ) : null}
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ["Products", "Owned products and release status"],
          ["Licenses", "Masked keys and activation health"],
          ["Support", "Tickets, reset requests, and help paths"],
        ].map(([label, copy]) => (
          <div key={label} className="rounded-md border border-white/8 bg-white/[0.035] p-4">
            <Bell className="h-4 w-4 text-[#ff6262]" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-white">{label}</p>
            <p className="mt-1 text-xs leading-5 text-white/45">{copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
