"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const adminSurface = pathname.startsWith("/admin");

  if (adminSurface) {
    return <main>{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main key={pathname} className="page-enter">{children}</main>
      <Footer />
    </>
  );
}
