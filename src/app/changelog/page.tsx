import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Changelog | MxF Labs",
  description: "Product releases, updates, fixes, security notices, and platform changes.",
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ChangelogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const productSlug = typeof params?.product === "string" ? params.product : "";
  const type = typeof params?.type === "string" ? params.type : "";
  const [entries, products, types] = await Promise.all([
    prisma.changelogEntry.findMany({
      where: {
        visible: true,
        ...(productSlug ? { product: { slug: productSlug } } : {}),
        ...(type ? { type } : {}),
      },
      include: { product: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.product.findMany({ where: { visible: true }, orderBy: { name: "asc" } }),
    prisma.changelogEntry.findMany({
      where: { visible: true },
      select: { type: true },
      distinct: ["type"],
      orderBy: { type: "asc" },
    }),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Changelog"
        title="Product releases, fixes, updates, and security notices."
        description="A public changelog platform that connects release notes back to each MxF Labs product."
      />
      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto grid max-w-5xl gap-4">
          <div className="surface flex flex-wrap gap-2 rounded-lg p-3">
            <FilterLink href="/changelog" active={!productSlug && !type}>All</FilterLink>
            {products.map((product) => (
              <FilterLink key={product.id} href={`/changelog?product=${product.slug}`} active={productSlug === product.slug}>
                {product.name}
              </FilterLink>
            ))}
            {types.map((entry) => (
              <FilterLink key={entry.type} href={`/changelog?type=${encodeURIComponent(entry.type)}`} active={type === entry.type}>
                {entry.type}
              </FilterLink>
            ))}
          </div>
          {entries.map((entry) => (
            <article key={entry.id} className="surface rounded-lg p-5">
              <p className="font-mono text-xs text-[#ff6262]">
                {entry.type} / {entry.product?.name || "Platform"} / {entry.releaseVersion || "General"}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">{entry.title}</h2>
              <p className="mt-2 text-sm leading-7 text-white/58">{entry.body}</p>
              <p className="mt-4 text-xs text-white/34">{entry.publishedAt.toLocaleDateString()}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
        active ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.035] text-white/58 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
