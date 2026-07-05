import {
  AlertTriangle,
  Bell,
  Boxes,
  BookOpen,
  CreditCard,
  Download,
  Flag,
  Gauge,
  HelpCircle,
  Inbox,
  KeyRound,
  ListChecks,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  PackageCheck,
  Palette,
  ReceiptText,
  Rocket,
  Settings,
  ShieldCheck,
  ScrollText,
  Users,
} from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/layout/logo";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";
import { AdminLogout } from "@/components/admin/admin-logout";

const primaryNav = [
  { label: "Dashboard", href: "/admin", icon: Gauge },
  { label: "Launch", href: "/admin/launch-wizard", icon: Rocket },
  { label: "Customize", href: "/admin/customize", icon: Palette },
  { label: "Products", href: "/admin/products", icon: PackageCheck },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Support", href: "/admin/support", icon: LifeBuoy },
  { label: "Orders", href: "/admin/orders", icon: CreditCard },
  { label: "Licenses", href: "/admin/licenses", icon: KeyRound },
  { label: "Discord", href: "/admin/discord", icon: ShieldCheck },
  { label: "Analytics", href: "/admin/analytics", icon: Gauge },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const navGroups = [
  {
    title: "Business",
    links: [
      { label: "Projects", href: "/admin/projects", icon: Boxes },
      { label: "Announcements", href: "/admin/announcements", icon: Bell },
      { label: "Contacts", href: "/admin/contacts", icon: Inbox },
      { label: "Payments", href: "/admin/payments", icon: ReceiptText },
      { label: "Legal", href: "/admin/customize#legal", icon: ScrollText },
    ],
  },
  {
    title: "Products",
    links: [
      { label: "Downloads", href: "/admin/downloads", icon: Download },
      { label: "Documentation", href: "/admin/documentation", icon: BookOpen },
      { label: "Feature Flags", href: "/admin/feature-flags", icon: Flag },
    ],
  },
  {
    title: "Operations",
    links: [
      { label: "Emails", href: "/admin/emails", icon: Mail },
      { label: "Suspicious Activity", href: "/admin/suspicious", icon: AlertTriangle },
      { label: "Setup Status", href: "/admin/setup-status", icon: ListChecks },
      { label: "Production Readiness", href: "/admin/production", icon: ShieldCheck },
    ],
  },
  {
    title: "System",
    links: [
      { label: "Logs", href: "/admin/logs", icon: ScrollText },
      { label: "Audit Trail", href: "/admin/audit", icon: ScrollText },
      { label: "Team", href: "/admin/team", icon: Users },
      { label: "Help", href: "/admin/help", icon: HelpCircle },
    ],
  },
];

export function AdminShell({
  children,
  title,
  description,
  adminEmail,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  adminEmail: string;
}) {
  return (
    <div className="min-h-screen bg-[#05070a] text-white">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/8 bg-white/[0.025] p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-1">
            <LogoMark />
            <div>
              <p className="text-sm font-semibold">MxF Admin</p>
              <p className="text-xs text-white/42">Studio control room</p>
            </div>
          </div>
          <nav className="mt-6 grid gap-1">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-white/58 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <Icon className="h-4 w-4 text-[#ff6262]" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
            <div className="my-3 h-px bg-white/8" />
            {navGroups.map((group) => (
              <details key={group.title} className="group rounded-md border border-white/8 bg-white/[0.02]">
                <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/38 transition group-open:text-[#ff6262]">
                  {group.title}
                </summary>
                <div className="grid gap-1 px-2 pb-2">
                  {group.links.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/52 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <Icon className="h-4 w-4 text-[#ff6262]" aria-hidden="true" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </details>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-white/8 bg-[#05070a]/82 px-5 py-4 backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-[#ff6262]">
                  <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
                  {adminEmail}
                </div>
                <h1 className="mt-2 text-2xl font-semibold md:text-3xl">{title}</h1>
                <p className="mt-1 text-sm text-white/50">{description}</p>
              </div>
              <div className="flex items-center gap-3">
                <AdminCommandPalette />
                <AdminLogout />
              </div>
            </div>
          </header>
          <main className="px-5 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
