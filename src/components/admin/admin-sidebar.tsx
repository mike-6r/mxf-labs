"use client";

import {
  AlertTriangle,
  Bell,
  Boxes,
  BookOpen,
  ChevronDown,
  CreditCard,
  Download,
  Flag,
  Gauge,
  HelpCircle,
  Inbox,
  KeyRound,
  ListChecks,
  LifeBuoy,
  Mail,
  Menu,
  PackageCheck,
  Palette,
  ReceiptText,
  Rocket,
  Settings,
  ShieldCheck,
  ScrollText,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LogoMark } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

type AdminNavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type AdminNavGroup = {
  title: string;
  links: AdminNavLink[];
};

const coreNav: AdminNavLink[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: Gauge },
  { label: "Launch", href: "/admin/launch", icon: Rocket },
  { label: "Customize", href: "/admin/customize", icon: Palette },
];

const navGroups: AdminNavGroup[] = [
  {
    title: "Business",
    links: [
      { label: "Projects", href: "/admin/projects", icon: Boxes },
      { label: "Announcements", href: "/admin/announcements", icon: Bell },
      { label: "Contacts", href: "/admin/contacts", icon: Inbox },
      { label: "Payments", href: "/admin/payments", icon: ReceiptText },
      { label: "Legal", href: "/admin/legal", icon: ScrollText },
    ],
  },
  {
    title: "Products",
    links: [
      { label: "Products", href: "/admin/products", icon: PackageCheck },
      { label: "Downloads", href: "/admin/downloads", icon: Download },
      { label: "Documentation", href: "/admin/documentation", icon: BookOpen },
      { label: "Feature Flags", href: "/admin/feature-flags", icon: Flag },
    ],
  },
  {
    title: "Operations",
    links: [
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Support", href: "/admin/support", icon: LifeBuoy },
      { label: "Orders", href: "/admin/orders", icon: CreditCard },
      { label: "Licenses", href: "/admin/licenses", icon: KeyRound },
      { label: "Discord", href: "/admin/discord", icon: ShieldCheck },
      { label: "Analytics", href: "/admin/analytics", icon: Gauge },
      { label: "Emails", href: "/admin/emails", icon: Mail },
      { label: "Suspicious Activity", href: "/admin/suspicious", icon: AlertTriangle },
    ],
  },
  {
    title: "System",
    links: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Setup Status", href: "/admin/setup-status", icon: ListChecks },
      { label: "Production Readiness", href: "/admin/production", icon: ShieldCheck },
      { label: "Logs", href: "/admin/logs", icon: ScrollText },
      { label: "Audit Trail", href: "/admin/audit", icon: ScrollText },
      { label: "Team", href: "/admin/team", icon: Users },
      { label: "Help", href: "/admin/help", icon: HelpCircle },
    ],
  },
];

function normalizePath(pathname: string) {
  if (pathname === "/admin") return "/admin/dashboard";
  if (pathname === "/admin/launch-wizard") return "/admin/launch";
  return pathname;
}

function isActiveLink(pathname: string, href: string) {
  const normalized = normalizePath(pathname);
  return normalized === href || normalized.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const normalizedPath = normalizePath(pathname);
  const activeGroup = navGroups.find((group) => group.links.some((link) => isActiveLink(normalizedPath, link.href)))?.title;
  const restoredOpenGroups = useRef(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => Object.fromEntries(navGroups.map((group) => [group.title, group.title === activeGroup])));

  useEffect(() => {
    let canceled = false;
    const restore = window.setTimeout(() => {
      if (canceled) return;
      try {
        const stored = window.localStorage.getItem("mxf-admin-open-groups");
        if (!stored) {
          restoredOpenGroups.current = true;
          return;
        }
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        setOpenGroups((current) => ({ ...current, ...parsed }));
        restoredOpenGroups.current = true;
      } catch {
        restoredOpenGroups.current = true;
        // Ignore invalid persisted sidebar state.
      }
    }, 0);

    return () => {
      canceled = true;
      window.clearTimeout(restore);
    };
  }, []);

  useEffect(() => {
    if (!restoredOpenGroups.current) return;
    try {
      window.localStorage.setItem("mxf-admin-open-groups", JSON.stringify(openGroups));
    } catch {
      // Persistence is optional.
    }
  }, [openGroups]);

  const allRoutes = useMemo(() => [...coreNav, ...navGroups.flatMap((group) => group.links)], []);

  return (
    <aside className="border-b border-white/8 bg-white/[0.025] p-4 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-3 px-1">
        <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-3">
          <LogoMark />
          <span className="min-w-0">
            <span className="block text-sm font-semibold">MxF Admin</span>
            <span className="block truncate text-xs text-white/42">Studio control room</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="inline-grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-white/72 lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="admin-sidebar-nav"
        >
          {mobileOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          <span className="sr-only">Toggle admin navigation</span>
        </button>
      </div>

      <nav id="admin-sidebar-nav" className={cn("mt-6 gap-1 lg:grid", mobileOpen ? "grid" : "hidden")} aria-label="Admin navigation">
        <div className="grid gap-1">
          {coreNav.map((item) => (
            <AdminLink key={item.href} item={item} active={isActiveLink(normalizedPath, item.href)} onNavigate={() => setMobileOpen(false)} />
          ))}
        </div>
        <div className="my-3 h-px bg-white/8" />
        <div className="grid gap-2">
          {navGroups.map((group) => {
            const groupActive = group.links.some((link) => isActiveLink(normalizedPath, link.href));
            const open = (openGroups[group.title] ?? false) || groupActive;

            return (
              <section key={group.title} className={cn("rounded-md border bg-white/[0.02] transition", groupActive ? "border-[#ff6262]/28" : "border-white/8")}>
                <button
                  type="button"
                  onClick={() => setOpenGroups((current) => ({ ...current, [group.title]: !open }))}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-white/44 transition hover:text-white"
                  aria-expanded={open}
                >
                  <span>{group.title}</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180", groupActive && "text-[#ff6262]")} aria-hidden="true" />
                </button>
                <div className={cn("grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="min-h-0">
                    <div className="grid gap-1 px-2 pb-2">
                      {group.links.map((item) => (
                        <AdminLink key={item.href} item={item} active={isActiveLink(normalizedPath, item.href)} nested onNavigate={() => setMobileOpen(false)} />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
        <div className="sr-only">
          {allRoutes.map((item) => (
            <span key={item.href}>{item.href}</span>
          ))}
        </div>
      </nav>
    </aside>
  );
}

function AdminLink({ item, active, nested = false, onNavigate }: { item: AdminNavLink; active: boolean; nested?: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md text-sm font-medium transition",
        nested ? "px-3 py-2.5" : "px-3 py-3",
        active
          ? "border border-[#ff6262]/24 bg-[#ff6262]/12 text-white"
          : "text-white/56 hover:bg-white/[0.06] hover:text-white",
      )}
    >
      <Icon className={cn("h-4 w-4", active ? "text-[#ff8c8c]" : "text-[#ff6262]")} aria-hidden="true" />
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  );
}
