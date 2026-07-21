"use client";

import { usePathname } from "next/navigation";
import { BookOpen, LockKeyhole, LogIn, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer } from "@/components/layout/footer";
import { Logo } from "@/components/layout/logo";
import { Navbar } from "@/components/layout/navbar";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const adminSurface = pathname.startsWith("/admin");
  const prelaunch = process.env.NEXT_PUBLIC_SITE_MODE !== "full";

  if (adminSurface) {
    return <main>{children}</main>;
  }

  if (prelaunch) {
    return (
      <>
        <PrelaunchNavbar pathname={pathname} />
        <main key={pathname} className="page-enter">{children}</main>
        <PrelaunchFooter />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main key={pathname} className="page-enter">{children}</main>
      <Footer />
    </>
  );
}

function PrelaunchNavbar({ pathname }: { pathname: string }) {
  const [adminAccess, setAdminAccess] = useState(false);
  const tabs = [
    { href: "/", label: "Launch" },
    { href: "/mxf-factions", label: "MxF Factions" },
    { href: "/docs/mxf-factions", label: "Documentation" },
  ];

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (active) setAdminAccess(Boolean(payload?.adminAccess));
      })
      .catch(() => {
        if (active) setAdminAccess(false);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#05070a]/78 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-5 md:px-8">
        <Logo />
        <div className="hidden items-center gap-1 rounded-md border border-white/10 bg-white/[0.035] p-1 md:flex">
          {tabs.map((tab) => {
            const active = pathname === tab.href || (tab.href === "/docs/mxf-factions" && pathname.startsWith("/docs"));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex min-h-8 items-center gap-2 rounded-[0.35rem] px-3 text-sm font-semibold transition ${
                  active ? "bg-white text-black" : "text-white/58 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {tab.href === "/mxf-factions" ? <Shield className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                {tab.href === "/docs/mxf-factions" ? <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                {tab.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/mxf-factions"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.04] px-3 text-sm font-semibold text-white/74 transition hover:border-[#ff6262]/45 hover:text-white md:hidden"
          >
            <Shield className="h-4 w-4" aria-hidden="true" />
            Factions
          </Link>
          <Link
            href="/docs/mxf-factions"
            className="hidden min-h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.04] px-3 text-sm font-semibold text-white/74 transition hover:border-[#ff6262]/45 hover:text-white lg:inline-flex"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Docs
          </Link>
          <Link
            href="/portal"
            className="hidden min-h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.04] px-3 text-sm font-semibold text-white/74 transition hover:border-[#ff6262]/45 hover:text-white sm:inline-flex"
          >
            Portal
          </Link>
          <Link
            href="/api/auth/discord/start"
            className="button-shine inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black transition hover:bg-[#fff0ed]"
          >
            <LogIn className="relative z-10 h-4 w-4" aria-hidden="true" />
            <span className="relative z-10 hidden sm:inline">Login</span>
            <span className="relative z-10 sm:hidden">Discord</span>
          </Link>
          {adminAccess ? (
            <Link
              href="/admin"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/12 bg-white/[0.04] text-white/70 transition hover:border-[#ff6262]/45 hover:text-white"
              aria-label="Admin panel"
            >
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
}

function PrelaunchFooter() {
  return (
    <footer className="border-t border-white/8 bg-black/[0.08] px-5 py-5 text-center text-xs text-white/38">
      MxF Labs pre-launch mode. Customer portal and admin operations remain online.
    </footer>
  );
}
