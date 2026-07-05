"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { navLinks } from "@/lib/content";
import { cn } from "@/lib/utils";

type CustomerSummary = {
  name: string;
  email: string;
  discordAvatar?: string | null;
  discordGlobalName?: string | null;
  discordUsername?: string | null;
};

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [visibleNavLinks, setVisibleNavLinks] = useState(navLinks);
  const pathname = usePathname();
  const router = useRouter();

  const close = () => setOpen(false);

  useEffect(() => {
    let active = true;

    fetch("/api/site-settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { settings?: Record<string, string> }) => {
        if (!active) return;
        const enabled = payload.settings?.["nav.enabled_items"]
          ?.split(",")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean);
        if (enabled?.length) {
          setVisibleNavLinks(navLinks.filter((link) => enabled.includes(link.label.toLowerCase())));
        }
      })
      .catch(() => null);

    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { authenticated?: boolean; customer?: CustomerSummary | null }) => {
        if (!active) return;
        setCustomer(payload.authenticated ? payload.customer || null : null);
      })
      .catch(() => {
        if (active) setCustomer(null);
      })
      .finally(() => {
        if (active) setAuthLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setCustomer(null);
    setOpen(false);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#05070a]/78 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-5 md:px-8">
        <Logo />

        <div className="hidden min-w-0 items-center gap-1 md:flex">
          {visibleNavLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium text-white/62 transition hover:bg-white/[0.06] hover:text-white lg:px-3",
                  active && "bg-white/[0.08] text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <Link
            href="/products"
            className="hidden items-center gap-2 rounded-md border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white transition hover:border-[#ff6262]/45 hover:bg-white/[0.07] lg:inline-flex"
          >
            View Products
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <AccountActions customer={customer} authLoaded={authLoaded} onLogout={logout} />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <MobileAccountButton customer={customer} authLoaded={authLoaded} />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/12 bg-white/[0.04] text-white"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="border-t border-white/8 bg-[#05070a]/96 px-5 py-5 backdrop-blur-xl md:hidden"
          >
            <div className="mx-auto grid max-w-7xl gap-2">
              {visibleNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="rounded-md border border-white/8 bg-white/[0.035] px-4 py-3 text-base font-medium text-white/78 transition hover:border-[#ff6262]/38 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/products"
                onClick={close}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-md border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white"
              >
                View Products
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              {customer ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link
                    href="/portal"
                    onClick={close}
                    className="button-shine inline-flex items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-black"
                  >
                    Portal
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/api/auth/discord/start"
                  onClick={close}
                  className="button-shine mt-2 inline-flex items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-black"
                >
                  Login with Discord
                </Link>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function AccountActions({
  customer,
  authLoaded,
  onLogout,
}: {
  customer: CustomerSummary | null;
  authLoaded: boolean;
  onLogout: () => void;
}) {
  if (!authLoaded) {
    return <div className="h-10 w-36 rounded-md border border-white/8 bg-white/[0.04]" aria-hidden="true" />;
  }

  if (!customer) {
    return (
      <Link
        href="/api/auth/discord/start"
        className="button-shine inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black transition hover:bg-[#fff0ed]"
      >
        Login with Discord
      </Link>
    );
  }

  const label = customer.discordGlobalName || customer.discordUsername || customer.name;

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/portal"
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.04] px-2.5 text-sm font-semibold text-white transition hover:border-[#ff6262]/45"
      >
        <Avatar customer={customer} />
        <span className="max-w-28 truncate">{label}</span>
      </Link>
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/12 bg-white/[0.04] text-white/70 transition hover:border-[#ff6262]/45 hover:text-white"
        aria-label="Logout"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function MobileAccountButton({ customer, authLoaded }: { customer: CustomerSummary | null; authLoaded: boolean }) {
  if (!authLoaded) {
    return <div className="h-10 w-10 rounded-md border border-white/8 bg-white/[0.04]" aria-hidden="true" />;
  }

  if (customer) {
    return (
      <Link href="/portal" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/12 bg-white/[0.04]">
        <Avatar customer={customer} />
      </Link>
    );
  }

  return (
    <Link
      href="/api/auth/discord/start"
      className="inline-flex min-h-10 items-center rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10 px-3 text-xs font-semibold text-[#ffd8d8]"
    >
      Discord
    </Link>
  );
}

function Avatar({ customer }: { customer: CustomerSummary }) {
  if (customer.discordAvatar) {
    return (
      <span
        aria-hidden="true"
        className="h-7 w-7 rounded-md border border-white/10 object-cover"
        style={{ backgroundImage: `url(${customer.discordAvatar})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
    );
  }

  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#ff6262]/12 text-xs font-semibold text-[#ffd8d8]">
      {(customer.discordGlobalName || customer.discordUsername || customer.name || "M").slice(0, 1).toUpperCase()}
    </span>
  );
}
