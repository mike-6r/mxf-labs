import type { Metadata } from "next";
import { Bug, CreditCard, KeyRound, LifeBuoy, MessageCircle, PackageCheck } from "lucide-react";
import Link from "next/link";
import { SupportRequestForm } from "@/components/forms/support-request-form";
import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { FaqList } from "@/components/sections/support-section";
import { getContentMode } from "@/lib/content-mode";
import { isPlaceholderContent } from "@/lib/content-quality";
import { prisma } from "@/lib/db/prisma";
import { getSettings } from "@/lib/db/settings";
import { CLEAN_HIDDEN_PRODUCT_STATUSES, PUBLIC_PRODUCT_STATUSES } from "@/lib/products/status";

export const metadata: Metadata = {
  title: "Support",
  description:
    "MxF Labs support hub for tickets, license help, purchase help, product support, Discord support, documentation, and FAQs.",
};

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const [settings, contentMode] = await Promise.all([
    getSettings(["social.discord_invite"]),
    getContentMode(),
  ]);
  const products = await prisma.product.findMany({
    where: {
      visible: true,
      ...(contentMode === "production" ? { status: { in: [...PUBLIC_PRODUCT_STATUSES] } } : {}),
      ...(contentMode === "clean" ? { status: { notIn: [...CLEAN_HIDDEN_PRODUCT_STATUSES] } } : {}),
    },
    select: { id: true, name: true, shortDescription: true },
    orderBy: { name: "asc" },
  });
  const discordInvite = settings["social.discord_invite"];
  const supportPaths = [
    { title: "Open Ticket", copy: "Submit a structured issue, reset request, or active-client support ticket.", icon: LifeBuoy, href: "#ticket" },
    { title: "License Help", copy: "Activation limits, HWID/IP resets, validation failures, and key ownership questions.", icon: KeyRound, href: "#ticket" },
    { title: "Purchase Help", copy: "Manual paid orders, checkout questions, invoices, refunds, and product access.", icon: CreditCard, href: "#ticket" },
    { title: "Product Help", copy: "Setup, docs, releases, compatibility, and product usage questions.", icon: PackageCheck, href: "/docs" },
    { title: "Bug Report", copy: "Unexpected behavior, broken flows, logs, reproduction steps, and severity.", icon: Bug, href: "#ticket" },
    ...(discordInvite && !isPlaceholderContent(discordInvite)
      ? [{ title: "Discord Support", copy: "Community-style support, product updates, and faster identity checks.", icon: MessageCircle, href: discordInvite }]
      : []),
  ];

  return (
    <>
      <PageHero
        eyebrow="Support"
        title="Support paths that route the request cleanly."
        description="Open tickets, license help, purchase questions, product guidance, bug reports, Discord support, and FAQs in one focused support surface."
      />
      <section className="px-5 pb-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {supportPaths.map((path) => {
              const Icon = path.icon;
              const external = path.href.startsWith("http");
              return (
                <Link
                  key={path.title}
                  href={path.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className="surface group rounded-lg p-5 transition hover:-translate-y-1 hover:border-[#ff6262]/24"
                >
                  <Icon className="h-5 w-5 text-[#ff6262]" aria-hidden="true" />
                  <h2 className="mt-4 text-xl font-semibold text-white">{path.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/54">{path.copy}</p>
                </Link>
              );
            })}
          </div>

          <div id="ticket" className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-start">
            <SupportRequestForm products={products} />
            <aside className="surface rounded-lg p-5">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Before submitting</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Include the details that make support fast.</h2>
              <div className="mt-5 grid gap-3">
                {["Product or service name", "License key if relevant, masked is fine", "Expected behavior", "Actual behavior", "Logs, screenshots, or filenames", "Urgency and deadline"].map((item) => (
                  <p key={item} className="rounded-md border border-white/8 bg-white/[0.03] p-3 text-sm text-white/56">{item}</p>
                ))}
              </div>
            </aside>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="surface rounded-lg p-5">
              <h2 className="text-2xl font-semibold text-white">Knowledge base</h2>
              <p className="mt-3 text-sm leading-7 text-white/56">
                Product setup guides, troubleshooting notes, license rules, and release references live in the docs hub as launch-ready articles are published.
              </p>
              <Link href="/docs" className="mt-5 inline-flex min-h-10 items-center rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/70 transition hover:border-[#ff6262]/35 hover:text-white">
                Open docs
              </Link>
            </section>
            <FaqList />
          </div>
        </div>
      </section>
      <CtaBand
        title="Need support for an active build?"
        description="Send the issue, expected behavior, screenshots or logs if available, and the urgency level so the request can be triaged cleanly."
      />
    </>
  );
}
