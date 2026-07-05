import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { globalSearch } from "@/lib/search/global";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Search | MxF Labs",
  description: "Search MxF Labs products, documentation, changelog, customer records, and platform operations.",
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const query = String((await searchParams)?.q || "").trim();
  const { results } = await globalSearch(query);

  return (
    <>
      <PageHero
        eyebrow="Search"
        title="Find products, docs, orders, tickets, and platform records."
        description="Search adapts to your current access level. Public visitors see public content; customers and admins see records they are allowed to access."
      />
      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-5xl">
          <form className="surface flex items-center gap-3 rounded-lg p-3">
            <Search className="h-5 w-5 text-[#ff6262]" aria-hidden="true" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search products, docs, licenses, orders, tickets..."
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/32"
            />
          </form>

          <div className="mt-6 grid gap-3">
            {results.map((result, index) => (
              <Link key={`${result.type}-${result.title}-${index}`} href={result.href} className="surface rounded-lg p-5 transition hover:-translate-y-1">
                <p className="font-mono text-xs text-[#ff6262]">{result.type} / {result.visibility}</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{result.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/52">{result.description}</p>
              </Link>
            ))}
            {query.length >= 2 && !results.length ? (
              <p className="surface rounded-lg p-5 text-sm text-white/52">No results found for “{query}”.</p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
