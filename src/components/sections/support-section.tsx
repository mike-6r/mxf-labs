import { ArrowUpRight, BookOpen, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { Stagger, StaggerItem } from "@/components/animations/reveal";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { faqs, supportChannels } from "@/lib/content";

export function SupportSection({ compact = false }: { compact?: boolean }) {
  return (
    <section id="support" className="px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Support"
            title="Clear support paths for clients and future products."
            description="Support should be structured, fast to understand, and easy to extend as products and client systems grow."
          />
          {compact ? (
            <ButtonLink href="/support" variant="secondary" className="w-fit">
              Support Hub
            </ButtonLink>
          ) : null}
        </div>

        <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
          {supportChannels.map((channel) => {
            const Icon = channel.icon;
            const external = channel.href.startsWith("http");
            return (
              <StaggerItem key={channel.title}>
                <Link
                  href={channel.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className="surface scanline group block h-full rounded-lg p-5 transition hover:-translate-y-1 hover:border-white/18"
                >
                  <Icon className="h-6 w-6 text-[#ff6262]" aria-hidden="true" />
                  <h3 className="mt-5 text-lg font-semibold text-white">{channel.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/58">{channel.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/72 group-hover:text-[#ff6262]">
                    Open
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>

        {!compact ? (
          <div className="mt-12 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div id="documentation" className="surface rounded-lg p-6">
              <BookOpen className="h-7 w-7 text-[#f7b955]" aria-hidden="true" />
              <h3 className="mt-5 text-2xl font-semibold text-white">Documentation hub</h3>
              <p className="mt-4 text-sm leading-7 text-white/60">
                Product docs, setup guides, changelogs, troubleshooting notes, and client handoff
                instructions can be published here as the product library expands.
              </p>
              <div className="mt-6 grid gap-3">
                {["Setup guides", "Changelogs", "Client onboarding", "Product references"].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-md border border-white/8 bg-white/[0.035] px-3 py-3 text-sm text-white/62"
                    >
                      <ClipboardCheck className="h-4 w-4 text-[#ff6262]" aria-hidden="true" />
                      {item}
                    </div>
                  ),
                )}
              </div>
            </div>
            <FaqList />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function FaqList() {
  return (
    <div className="grid gap-3">
      {faqs.map((faq) => (
        <details key={faq.question} className="surface group rounded-lg p-5">
          <summary className="cursor-pointer list-none text-base font-semibold text-white">
            {faq.question}
          </summary>
          <p className="mt-4 text-sm leading-7 text-white/58">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
