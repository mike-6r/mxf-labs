import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Clock3, Layers3, Search } from "lucide-react";
import Link from "next/link";
import { MarkdownBlock } from "@/components/content/markdown-block";
import { ButtonLink } from "@/components/ui/button-link";
import { getPublicDocumentationArticle, getPublicDocumentationArticles } from "@/lib/db/public";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicDocumentationArticle(slug);
  return { title: article?.title || "Documentation", description: article?.excerpt };
}

export default async function DocDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [article, articles] = await Promise.all([
    getPublicDocumentationArticle(slug),
    getPublicDocumentationArticles(),
  ]);

  if (!article) {
    notFound();
  }

  const currentIndex = articles.findIndex((item) => item.slug === article.slug);
  const previous = currentIndex > 0 ? articles[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;
  const productArticles = articles.filter((item) => (article.product ? item.product?.slug === article.product.slug : !item.product));
  const categories = [...new Set(productArticles.map((item) => item.category))];

  return (
    <section className="px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="surface h-fit rounded-lg p-4 lg:sticky lg:top-24">
          <ButtonLink href="/docs" variant="ghost" className="mb-4 min-h-9 px-0 py-1" showArrow={false}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to docs
          </ButtonLink>

          <form action="/docs" className="mb-5 flex items-center gap-2 rounded-md border border-white/8 bg-black/20 px-3">
            <Search className="h-4 w-4 text-[#ff6262]" aria-hidden="true" />
            <input name="q" placeholder="Search docs..." className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
          </form>

          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff8a8a]">
            {article.product?.name || "Platform"}
          </p>
          <div className="mt-4 grid gap-4">
            {categories.map((category) => (
              <div key={category}>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/34">{category}</p>
                <div className="grid gap-2">
                  {productArticles
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <Link
                        key={item.id}
                        href={`/docs/${item.slug}`}
                        className={cn(
                          "rounded-md border p-3 text-sm leading-5 transition",
                          item.slug === article.slug
                            ? "border-[#ff6262]/35 bg-[#ff6262]/10 text-white"
                            : "border-white/8 bg-white/[0.03] text-white/55 hover:border-[#ff6262]/35 hover:text-white",
                        )}
                      >
                        {item.title}
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <article className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-white/42">
            <Link href="/docs" className="transition hover:text-white">Docs</Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span>{article.category}</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="text-white/62">{article.product?.name || "Platform"}</span>
          </div>

          <div className="surface-strong rounded-lg p-6 md:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#ff8a8a]">{article.category} / {article.product?.name || "Platform"}</p>
            <h1 className="mt-5 text-balance text-4xl font-semibold text-white md:text-6xl">{article.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/62">{article.excerpt}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <DocMetric icon={Layers3} label="Docs version" value={`v${article.version}`} />
              <DocMetric icon={BookOpen} label="Product version" value={article.productVersion || "Platform"} />
              <DocMetric icon={Clock3} label="Last updated" value={formatDate(article.updatedAt)} />
            </div>
          </div>

          <div className="surface mt-5 rounded-lg p-6 md:p-8">
            <MarkdownBlock body={article.bodyMarkdown} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {previous ? <DocNav href={`/docs/${previous.slug}`} label="Previous" title={previous.title} icon={ArrowLeft} /> : <DocNav href="/support" label="Need help?" title="Open a support ticket" icon={BookOpen} />}
            {next ? <DocNav href={`/docs/${next.slug}`} label="Next" title={next.title} icon={ArrowRight} alignRight /> : <DocNav href="/products" label="Finished" title="Browse products" icon={ArrowRight} alignRight />}
          </div>
        </article>
      </div>
    </section>
  );
}

function DocNav({ href, label, title, icon: Icon, alignRight = false }: { href: string; label: string; title: string; icon: LucideIcon; alignRight?: boolean }) {
  return (
    <Link href={href} className={alignRight ? "surface group rounded-lg p-4 text-right transition hover:-translate-y-0.5" : "surface group rounded-lg p-4 transition hover:-translate-y-0.5"}>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff8a8a]">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white group-hover:text-[#ffd8d8] sm:justify-start">
        {!alignRight ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
        <span className="line-clamp-1">{title}</span>
        {alignRight ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      </p>
    </Link>
  );
}

function DocMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.03] p-3">
      <Icon className="h-4 w-4 text-[#ff6262]" aria-hidden="true" />
      <p className="mt-2 text-xs text-white/34">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
