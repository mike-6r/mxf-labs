import Link from "next/link";
import { ArrowLeft, LifeBuoy, Mail, PackageCheck } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/animations/reveal";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

export type LegalSection = {
  id: string;
  title: string;
  body?: string;
  bullets?: string[];
};

type LegalPageProps = {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
  contactEmail: string;
  statusNote?: string;
};

type ParsedBlock =
  | { type: "heading"; level: 3 | 4; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "ul" | "ol"; items: string[] };

export function LegalPage({
  title,
  description,
  lastUpdated,
  sections,
  contactEmail,
  statusNote,
}: LegalPageProps) {
  return (
    <main className="px-5 pb-24 pt-14 md:px-8 md:pb-32 md:pt-20">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <ButtonLink href="/" variant="ghost" className="mb-8 px-0" showArrow={false}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back home
          </ButtonLink>
        </Reveal>

        <Reveal className="relative overflow-hidden border-b border-white/10 pb-12 md:pb-16">
          <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-[#ff6262]/10 blur-3xl" />
          <div className="relative max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffb0b0]">Legal</p>
            <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold leading-[1.02] text-white md:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/62 md:text-lg">{description}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-white/44">
              <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5">
                Last updated: {lastUpdated}
              </span>
              {statusNote ? (
                <span className="rounded-full border border-[#ff6262]/18 bg-[#ff6262]/8 px-3 py-1.5 text-[#ffd8d8]">
                  {statusNote}
                </span>
              ) : null}
            </div>
          </div>
        </Reveal>

        <div className="grid gap-10 py-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14 lg:py-16">
          <Reveal className="lg:sticky lg:top-28 lg:h-fit">
            <LegalToc sections={sections} />
          </Reveal>

          <Stagger className="min-w-0">
            <div className="mx-auto grid max-w-[880px] gap-8">
              {sections.map((section, index) => (
                <StaggerItem key={section.id} id={section.id} className="scroll-mt-28">
                  <LegalDocumentSection section={section} index={index} />
                </StaggerItem>
              ))}
            </div>
          </Stagger>
        </div>

        <Reveal>
          <LegalFooterCta contactEmail={contactEmail} />
        </Reveal>
      </div>
    </main>
  );
}

export function UnavailableLegalPage({
  title,
  contactEmail,
}: {
  title: string;
  contactEmail: string;
}) {
  return (
    <LegalPage
      title={title}
      description="This policy is being finalized and will be available before public launch."
      lastUpdated="Pending legal review"
      contactEmail={contactEmail}
      statusNote="Production copy unavailable"
      sections={[
        {
          id: "policy-unavailable",
          title: "Policy unavailable",
          body:
            "MxF Labs is not currently displaying this policy because production-ready legal copy has not been published. Please contact support if you need a copy before completing a purchase or project agreement.",
        },
      ]}
    />
  );
}

function LegalToc({ sections }: { sections: LegalSection[] }) {
  return (
    <aside className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/38">On this page</p>
      <nav className="mt-4 grid gap-1" aria-label="Legal page sections">
        {sections.map((section, index) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="group flex items-center gap-3 rounded-md px-2 py-2 text-sm text-white/52 transition hover:bg-white/[0.045] hover:text-white"
          >
            <span className="font-mono text-xs text-white/28 group-hover:text-[#ffb0b0]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 truncate">{section.title}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}

function LegalDocumentSection({ section, index }: { section: LegalSection; index: number }) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.025] px-5 py-6 md:px-8 md:py-8">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-start">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#ffb0b0]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h2 className="text-balance text-2xl font-semibold text-white md:text-3xl">{section.title}</h2>
      </div>
      <div className="mt-6">
        {section.body ? <FormattedLegalText value={section.body} /> : null}
        {section.bullets?.length ? (
          <ul className={cn("grid gap-3", section.body && "mt-6")}>
            {section.bullets.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-7 text-white/60 md:text-[0.95rem]">
                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff6262]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

function FormattedLegalText({ value }: { value: string }) {
  const blocks = parseLegalContent(value);

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Heading = block.level === 3 ? "h3" : "h4";
          return (
            <Heading key={`${block.text}-${index}`} className="pt-2 text-lg font-semibold text-white md:text-xl">
              {block.text}
            </Heading>
          );
        }

        if (block.type === "ul" || block.type === "ol") {
          const List = block.type;
          return (
            <List key={`${block.type}-${index}`} className="grid gap-3 pl-5 text-sm leading-7 text-white/60 marker:text-[#ff6262] md:text-[0.95rem]">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </List>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={`paragraph-${index}`} className="text-sm leading-7 text-white/60 md:text-[0.95rem] md:leading-8">
              {block.lines.map((line, lineIndex) => (
                <span key={`${line}-${lineIndex}`}>
                  {line}
                  {lineIndex < block.lines.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}

function LegalFooterCta({ contactEmail }: { contactEmail: string }) {
  return (
    <section className="relative mx-auto max-w-[880px] overflow-hidden rounded-lg border border-white/10 bg-[#080b10] p-6 premium-depth md:p-8">
      <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-[#ff6262]/12 blur-3xl" />
      <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffb0b0]">Need help?</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Questions before purchase or support?</h2>
          <p className="mt-3 text-sm leading-7 text-white/56">
            Review product details, open support, or contact MxF Labs directly for policy questions.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/products" variant="secondary">
            <PackageCheck className="h-4 w-4" aria-hidden="true" />
            Products
          </ButtonLink>
          <ButtonLink href="/support" variant="secondary">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            Support
          </ButtonLink>
          <Link
            href={`mailto:${contactEmail}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black transition hover:bg-[#fff4f2]"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Contact
          </Link>
        </div>
      </div>
    </section>
  );
}

function parseLegalContent(value: string): ParsedBlock[] {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const blocks: ParsedBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    const clean = paragraph.map((line) => line.trim()).filter(Boolean);
    if (clean.length) blocks.push({ type: "paragraph", lines: clean });
    paragraph = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      blocks.push({ type: "heading", level: headingMatch[1].length === 1 ? 3 : 4, text: headingMatch[2].trim() });
      continue;
    }

    const plainHeadingMatch = line.match(/^\*\*(.+)\*\*$/);
    if (plainHeadingMatch) {
      flushParagraph();
      blocks.push({ type: "heading", level: 4, text: plainHeadingMatch[1].trim() });
      continue;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      const items = [bulletMatch[1].trim()];
      while (lines[index + 1]?.trim().match(/^[-*•]\s+(.+)$/)) {
        index += 1;
        items.push(lines[index].trim().replace(/^[-*•]\s+/, ""));
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    const numberedMatch = line.match(/^\d+[\.)]\s+(.+)$/);
    if (numberedMatch) {
      flushParagraph();
      const items = [numberedMatch[1].trim()];
      while (lines[index + 1]?.trim().match(/^\d+[\.)]\s+(.+)$/)) {
        index += 1;
        items.push(lines[index].trim().replace(/^\d+[\.)]\s+/, ""));
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks.length ? blocks : [{ type: "paragraph", lines: [value.trim()] }];
}
