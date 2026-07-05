import type { Metadata } from "next";
import { BookOpen, ChevronRight, Code2, FileText, Filter, Layers3, Search } from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublicDocumentationArticles } from "@/lib/db/public";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Docs | MxF Labs",
  description: "MxF Labs documentation hub for setup guides, API references, troubleshooting, and product docs.",
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const documentationCategories = [
  "Getting Started",
  "Installation",
  "Requirements",
  "Configuration",
  "Commands",
  "Permissions",
  "Variables",
  "API",
  "Integrations",
  "Developer API",
  "FAQ",
  "Troubleshooting",
  "Changelog",
];

export default async function DocsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = String(params?.q || params?.query || "").trim();
  const selectedProduct = String(params?.product || "all").trim();
  const allArticles = await getPublicDocumentationArticles(query);
  const productOptions = uniqueProducts(allArticles);
  const articles = allArticles.filter((article) => {
    if (selectedProduct === "all") return true;
    if (selectedProduct === "platform") return !article.product;
    return article.product?.slug === selectedProduct;
  });
  const categories = documentationCategories.filter((category) => articles.some((article) => article.category === category));
  const extraCategories = [...new Set(articles.map((article) => article.category))].filter((category) => !documentationCategories.includes(category));
  const categoryList = [...categories, ...extraCategories];
  const featured = articles[0];

  return (
    <>
      <PageHero
        eyebrow="Documentation"
        title="A documentation platform for products that are meant to be operated."
        description="Searchable product docs, setup guides, API notes, permissions, variables, changelogs, and troubleshooting references for the MxF Labs ecosystem."
      />
      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[18rem_1fr]">
          <aside className="surface h-fit rounded-lg p-4 lg:sticky lg:top-24">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff8a8a]">Product docs</p>
            <div className="mt-4 grid gap-2">
              <SideLink href={docsHref({ q: query })} active={selectedProduct === "all"} label="All products" count={allArticles.length} />
              <SideLink href={docsHref({ q: query, product: "platform" })} active={selectedProduct === "platform"} label="Platform" count={allArticles.filter((article) => !article.product).length} />
              {productOptions.map((product) => (
                <SideLink
                  key={product.slug}
                  href={docsHref({ q: query, product: product.slug })}
                  active={selectedProduct === product.slug}
                  label={product.name}
                  count={allArticles.filter((article) => article.product?.slug === product.slug).length}
                />
              ))}
            </div>

            <div className="mt-6 border-t border-white/8 pt-5">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff8a8a]">Categories</p>
            <div className="mt-4 grid gap-2">
              {categoryList.length ? (
                categoryList.map((category) => (
                  <a key={category} href={`#${categoryId(category)}`} className="flex min-h-10 items-center justify-between rounded-md border border-white/8 bg-white/[0.03] px-3 text-sm font-semibold text-white/60 transition hover:border-[#ff6262]/35 hover:text-white">
                    <span>{category}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs text-white/30">{articles.filter((article) => article.category === category).length}</span>
                      <ChevronRight className="h-4 w-4 text-white/30" aria-hidden="true" />
                    </span>
                  </a>
                ))
              ) : (
                <p className="rounded-md border border-white/8 bg-white/[0.03] p-3 text-sm text-white/45">No categories yet.</p>
              )}
            </div>
            </div>
            <div className="mt-5 rounded-md border border-white/8 bg-black/20 p-3">
              <Code2 className="h-4 w-4 text-[#f7b955]" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-white">Code-ready docs</p>
              <p className="mt-1 text-xs leading-5 text-white/45">Code blocks support language labels and copy actions for implementation work.</p>
            </div>
          </aside>

          <div className="min-w-0">
            <form className="surface mb-5 grid gap-3 rounded-lg p-3 lg:grid-cols-[1fr_15rem_10rem]">
              <label className="flex items-center gap-3 rounded-md border border-white/8 bg-black/20 px-3">
                <Search className="h-5 w-5 text-[#ff6262]" aria-hidden="true" />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search setup, API, permissions, variables..."
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/32"
                />
              </label>
              <label className="flex items-center gap-2 rounded-md border border-white/8 bg-black/20 px-3">
                <Filter className="h-4 w-4 text-white/34" aria-hidden="true" />
                <select name="product" defaultValue={selectedProduct} className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none">
                  <option value="all">All products</option>
                  <option value="platform">Platform</option>
                  {productOptions.map((product) => (
                    <option key={product.slug} value={product.slug}>{product.name}</option>
                  ))}
                </select>
              </label>
              <button className="button-shine inline-flex min-h-11 items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-black">
                Search docs
              </button>
            </form>

            {featured ? (
              <Link href={`/docs/${featured.slug}`} className="surface-strong group mb-5 block overflow-hidden rounded-lg p-5 transition hover:-translate-y-0.5">
                <div className="grid gap-5 lg:grid-cols-[1fr_14rem] lg:items-center">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff8a8a]">Start here / {featured.category}</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white group-hover:text-[#ffd8d8]">{featured.title}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/56">{featured.excerpt}</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-black/24 p-3">
                    <Meta label="Product" value={featured.product?.name || "Platform"} />
                    <Meta label="Version" value={`v${featured.version}`} />
                    <Meta label="Updated" value={formatDate(featured.updatedAt)} />
                  </div>
                </div>
              </Link>
            ) : null}

            {categoryList.length ? (
              <div className="grid gap-5">
                {categoryList.map((category) => (
                  <section key={category} id={categoryId(category)} className="surface rounded-lg p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#ff6262]" aria-hidden="true" />
                      <h2 className="text-xl font-semibold text-white">{category}</h2>
                      </div>
                      <span className="rounded-md border border-white/8 bg-white/[0.03] px-2.5 py-1 font-mono text-xs text-white/36">
                        {articles.filter((article) => article.category === category).length} articles
                      </span>
                    </div>
                    <div className="mt-4 divide-y divide-white/8">
                      {articles
                        .filter((article) => article.category === category)
                        .map((article) => (
                          <Link key={article.id} href={`/docs/${article.slug}`} className="group grid gap-3 py-4 first:pt-0 last:pb-0 lg:grid-cols-[1fr_auto] lg:items-center">
                            <div>
                              <p className="text-base font-semibold text-white transition group-hover:text-[#ffd8d8]">{article.title}</p>
                              <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/48">{article.excerpt}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 lg:justify-end">
                              <span className="w-fit rounded-md border border-white/8 bg-white/[0.03] px-2.5 py-1 text-xs text-white/44">
                                {article.product?.name || "Platform"}
                              </span>
                              <span className="w-fit rounded-md border border-white/8 bg-white/[0.03] px-2.5 py-1 text-xs text-white/44">
                                {formatDate(article.updatedAt)}
                              </span>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title={query ? "No docs matched your search." : "No docs published yet."}
                description={query ? "Try a product name, setup term, or support keyword." : "Documentation appears here when launch-ready articles are published."}
                action={{ label: "Open support", href: "/support" }}
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function uniqueProducts(articles: Awaited<ReturnType<typeof getPublicDocumentationArticles>>) {
  const map = new Map<string, { slug: string; name: string }>();
  for (const article of articles) {
    if (article.product) {
      map.set(article.product.slug, { slug: article.product.slug, name: article.product.name });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function docsHref({ q, product }: { q?: string; product?: string }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (product && product !== "all") params.set("product", product);
  const value = params.toString();
  return value ? `/docs?${value}` : "/docs";
}

function categoryId(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function SideLink({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-10 items-center justify-between rounded-md border px-3 text-sm font-semibold transition",
        active
          ? "border-white/16 bg-white text-black"
          : "border-white/8 bg-white/[0.03] text-white/60 hover:border-[#ff6262]/35 hover:text-white",
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Layers3 className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      <span className="font-mono text-xs opacity-60">{count}</span>
    </Link>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/8 py-2 first:pt-0 last:border-b-0 last:pb-0">
      <p className="text-xs text-white/32">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
