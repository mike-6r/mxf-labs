import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { footerLinks, siteConfig } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-black/[0.08]">
      <div className="mx-auto grid w-full max-w-7xl gap-9 px-5 py-10 md:px-8 lg:grid-cols-[1.1fr_2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/54">
            MxF Labs builds sharp web systems, bots, plugins, panels, and products for people
            who need clean execution without corporate drag.
          </p>
          <a className="mt-4 inline-flex text-sm font-semibold text-[#ff6262] transition hover:text-white" href={`mailto:${siteConfig.email}`}>
            {siteConfig.email}
          </a>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">{group.title}</h2>
              <div className="mt-4 grid gap-2.5">
                {group.links.map((link, index) => {
                  if (!link.href || link.href.includes("your-server") || link.href.includes("your-username")) {
                    return null;
                  }
                  const external = link.href.startsWith("http");
                  return (
                    <Link
                      key={`${group.title}-${link.label}-${link.href}-${index}`}
                      href={link.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noreferrer" : undefined}
                      className="w-fit text-sm text-white/58 transition hover:text-[#ff6262]"
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          </div>
      </div>
      <div className="border-t border-white/8 px-5 py-4 text-center text-xs text-white/38">
        Copyright {new Date().getFullYear()} MxF Labs. Premium software, products, and support systems.
      </div>
    </footer>
  );
}
