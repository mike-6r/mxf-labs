"use client";

import { ArrowLeft, BookOpen, ChevronRight, Clipboard, Layers3, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type ProductManualArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  bodyMarkdown: string;
  version: string;
  productVersion: string | null;
  updatedAt: string;
  sortOrder?: number;
};

type ProductDocsManualProps = {
  productName: string;
  productSlug: string;
  description: string;
  articles: ProductManualArticle[];
};

const categoryOrder = [
  "Getting Started",
  "Installation",
  "Requirements",
  "Configuration",
  "Feature Setup",
  "Commands",
  "Permissions",
  "Variables",
  "Gameplay",
  "Progression",
  "Competitive",
  "Staff Operations",
  "Integrations",
  "Licensing",
  "Web Dashboard",
  "Troubleshooting",
];

export function ProductDocsManual({ productName, productSlug, description, articles }: ProductDocsManualProps) {
  const [query, setQuery] = useState("");
  const [activeSlug, setActiveSlug] = useState(articles[0]?.slug || "");

  const filteredArticles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return articles;
    return articles.filter((article) => searchableText(article).includes(normalized));
  }, [articles, query]);

  const groupedArticles = useMemo(() => groupArticles(filteredArticles), [filteredArticles]);
  const visibleSlugs = new Set(filteredArticles.map((article) => article.slug));
  const activeArticle = articles.find((article) => article.slug === activeSlug && visibleSlugs.has(article.slug)) || filteredArticles[0] || articles[0] || null;

  return (
    <section className="px-5 pb-24 pt-12 md:px-8 md:pb-32 md:pt-18">
      <div className="mx-auto max-w-7xl">
        <Link href={`/${productSlug}`} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/48 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to product preview
        </Link>

        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#07090d]/88 premium-depth">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,98,98,0.13),transparent_30%),radial-gradient(circle_at_94%_16%,rgba(255,209,102,0.08),transparent_34%)]" />
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6262]/70 to-transparent" />

          <div className="relative border-b border-white/10 p-5 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff6262]">{productName} Documentation</p>
                <h1 className="mt-4 max-w-4xl text-balance text-4xl font-semibold leading-tight text-white md:text-6xl">
                  Owner manual for setup, configuration, and live operation.
                </h1>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-white/58 md:text-base md:leading-8">{description}</p>
              </div>

              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search setup, commands, features..."
                  className="h-12 w-full rounded-md border border-white/10 bg-black/28 pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/32 focus:border-[#ff6262]/45"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-3">
              <DocStat label="Articles" value={String(articles.length)} />
              <DocStat label="Sections" value={String(groupArticles(articles).length)} />
              <DocStat label="Product" value="MxF Factions" />
            </div>
          </div>

          <div className="relative grid min-h-[46rem] lg:grid-cols-[20rem_1fr]">
            <aside className="border-b border-white/10 bg-black/18 p-4 lg:border-b-0 lg:border-r lg:border-white/10">
              <div className="lg:sticky lg:top-24">
                <div className="mb-4 rounded-md border border-white/8 bg-white/[0.025] p-3">
                  <BookOpen className="h-4 w-4 text-[#ff8a8a]" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-white">Start with installation, then configure systems feature by feature.</p>
                  <p className="mt-2 text-xs leading-5 text-white/42">Each section explains what the system does, where it is configured, and how owners should verify it.</p>
                </div>

                <div className="max-h-[40rem] overflow-y-auto pr-1">
                  {groupedArticles.length ? (
                    groupedArticles.map((group) => (
                      <div key={group.category} className="mb-5">
                        <div className="mb-2 flex items-center justify-between gap-3 px-2">
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <Layers3 className="h-3.5 w-3.5 shrink-0 text-[#ff8a8a]" aria-hidden="true" />
                            <span className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/36">{group.category}</span>
                          </span>
                          <span className="font-mono text-xs text-white/24">{group.articles.length}</span>
                        </div>
                        <div className="grid gap-1">
                          {group.articles.map((article) => {
                            const active = activeArticle?.slug === article.slug;
                            return (
                              <button
                                key={article.slug}
                                type="button"
                                onClick={() => setActiveSlug(article.slug)}
                                className={cn(
                                  "group flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition",
                                  active ? "bg-white text-black" : "text-white/56 hover:bg-white/[0.055] hover:text-white",
                                )}
                              >
                                <span className="min-w-0 truncate">{article.title}</span>
                                <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition", active ? "text-black/54" : "text-white/24 group-hover:text-white/52")} aria-hidden="true" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-white/[0.026] p-4 text-sm text-white/50">
                      No matching docs found.
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <main className="min-w-0 bg-black/[0.08] p-5 md:p-8">
              {activeArticle ? (
                <article className="mx-auto max-w-4xl">
                  <div className="mb-7 border-b border-white/10 pb-7">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#ff6262]">{activeArticle.category}</p>
                    <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight text-white md:text-5xl">{activeArticle.title}</h2>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-white/56">{activeArticle.excerpt}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <SmallPill label={`Docs v${activeArticle.version}`} />
                      <SmallPill label={activeArticle.productVersion ? `Product ${activeArticle.productVersion}` : "Product docs"} />
                      <SmallPill label={`Updated ${formatDate(activeArticle.updatedAt)}`} />
                    </div>
                  </div>

                  <ClientMarkdownBlock body={activeArticle.bodyMarkdown} />

                  <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.025] p-5">
                    <p className="text-sm font-semibold text-white">Need this as a standalone article?</p>
                    <p className="mt-2 text-sm leading-6 text-white/48">Open the article route for direct linking in tickets, Discord, release notes, or customer onboarding.</p>
                    <Link href={`/docs/${activeArticle.slug}`} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/72 transition hover:border-[#ff6262]/35 hover:text-white">
                      Open article
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[0.026] p-5 text-sm text-white/50">
                  No docs are published for this product yet.
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </section>
  );
}

function DocStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#05070a]/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/32">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-white/72">{value}</p>
    </div>
  );
}

function SmallPill({ label }: { label: string }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-white/48">{label}</span>;
}

function ClientMarkdownBlock({ body }: { body: string }) {
  const lines = body.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let code: string[] = [];
  let codeLanguage = "text";
  let inCode = false;

  lines.forEach((line, index) => {
    if (line.startsWith("```")) {
      if (inCode) {
        const codeValue = code.join("\n");
        nodes.push(<CodeBlock key={`code-${index}`} language={codeLanguage} value={codeValue} />);
        code = [];
        codeLanguage = "text";
      } else {
        codeLanguage = line.replace("```", "").trim() || "text";
      }
      inCode = !inCode;
      return;
    }

    if (inCode) {
      code.push(line);
      return;
    }

    if (!line.trim()) {
      nodes.push(<div key={index} className="h-3" />);
      return;
    }

    if (line.startsWith("# ")) {
      return;
    }

    if (line.startsWith("## ")) {
      nodes.push(
        <h3 key={index} className="mt-10 border-t border-white/10 pt-8 text-2xl font-semibold text-white">
          {line.replace("## ", "")}
        </h3>,
      );
      return;
    }

    if (line.startsWith("### ")) {
      nodes.push(
        <h4 key={index} className="mt-7 text-xl font-semibold text-white">
          {line.replace("### ", "")}
        </h4>,
      );
      return;
    }

    if (line.startsWith("> ")) {
      nodes.push(
        <div key={index} className="my-4 rounded-md border border-[#ffd166]/16 bg-[#ffd166]/7 p-4 text-sm leading-7 text-[#ffe7b3]/78">
          {inlineCode(line.replace(/^>\s?/, ""))}
        </div>,
      );
      return;
    }

    if (line.startsWith("|") && lines[index + 1]?.startsWith("|") && lines[index + 1]?.includes("---")) {
      const tableLines = [line];
      let cursor = index + 2;
      while (cursor < lines.length && lines[cursor].startsWith("|")) {
        tableLines.push(lines[cursor]);
        cursor += 1;
      }
      nodes.push(<MarkdownTable key={`table-${index}`} lines={tableLines} />);
      for (let skip = index + 1; skip < cursor; skip += 1) {
        lines[skip] = "";
      }
      return;
    }

    if (line.startsWith("- ")) {
      nodes.push(
        <p key={index} className="flex items-start gap-3 pl-1 text-sm leading-7 text-white/64">
          <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff6262]" aria-hidden="true" />
          <span>{inlineCode(line.replace("- ", ""))}</span>
        </p>,
      );
      return;
    }

    if (/^\d+\.\s/.test(line)) {
      nodes.push(
        <p key={index} className="rounded-md border border-white/8 bg-white/[0.025] px-4 py-3 text-sm leading-7 text-white/64">
          {inlineCode(line)}
        </p>,
      );
      return;
    }

    nodes.push(
      <p key={index} className="text-sm leading-7 text-white/64">
        {inlineCode(line)}
      </p>,
    );
  });

  return <div>{nodes}</div>;
}

function MarkdownTable({ lines }: { lines: string[] }) {
  const [headerLine, ...bodyLines] = lines;
  const rows = bodyLines.filter((line) => !line.includes("---"));
  const headers = tableCells(headerLine);

  return (
    <div className="my-5 overflow-x-auto rounded-md border border-white/10 bg-black/24">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-white/[0.045]">
          <tr>
            {headers.map((cell) => (
              <th key={cell} className="border-b border-white/10 px-4 py-3 font-semibold text-white">
                {inlineCode(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">
          {rows.map((row, rowIndex) => (
            <tr key={`${row}-${rowIndex}`}>
              {tableCells(row).map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="max-w-[28rem] px-4 py-3 leading-6 text-white/62">
                  {inlineCode(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function tableCells(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative my-4 overflow-hidden rounded-md border border-white/10 bg-black/42">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.045] px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-[0.16em] text-white/36">{language}</span>
        <button type="button" onClick={copy} className="inline-flex min-h-8 items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-white/56 transition hover:text-white">
          <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm text-[#ffd8d8]">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function inlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);

  return parts.map((part, index) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={index} className="rounded bg-white/10 px-1.5 py-0.5 text-[#ffd8d8]">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

function groupArticles(articles: ProductManualArticle[]) {
  const map = new Map<string, ProductManualArticle[]>();
  for (const article of articles) {
    map.set(article.category, [...(map.get(article.category) || []), article]);
  }

  return [...map.entries()]
    .sort(([a], [b]) => categoryRank(a) - categoryRank(b) || a.localeCompare(b))
    .map(([category, groupArticles]) => ({
      category,
      articles: groupArticles.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || a.title.localeCompare(b.title)),
    }));
}

function categoryRank(category: string) {
  const index = categoryOrder.indexOf(category);
  return index === -1 ? categoryOrder.length : index;
}

function searchableText(article: ProductManualArticle) {
  return `${article.title} ${article.category} ${article.excerpt} ${article.bodyMarkdown}`.toLowerCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
