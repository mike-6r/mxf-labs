"use client";

import { usePathname } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";
import Link from "next/link";
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
        <PrelaunchNavbar />
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

function PrelaunchNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#05070a]/78 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-5 md:px-8">
        <Logo />
        <div className="flex items-center gap-2">
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
          <Link
            href="/admin/login"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/12 bg-white/[0.04] text-white/70 transition hover:border-[#ff6262]/45 hover:text-white"
            aria-label="Admin login"
          >
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          </Link>
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
