import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDocsManual, type ProductManualArticle } from "@/components/docs/product-docs-manual";
import sourceDocs from "@/data/mxf-factions-docs.json";
import { getPublicDocumentationArticles, getPublicProduct } from "@/lib/db/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MxF Factions Documentation",
  description:
    "Setup, configuration, feature operation, commands, permissions, troubleshooting, and owner guidance for MxF Factions.",
};

export default async function MxfFactionsDocumentationPage() {
  const [product, allArticles] = await Promise.all([
    getPublicProduct("mxf-factions"),
    getPublicDocumentationArticles(),
  ]);

  const databaseArticles = allArticles
    .filter((article) => article.product?.slug === "mxf-factions")
    .map<ProductManualArticle>((article) => ({
      id: article.id,
      slug: article.slug,
      title: article.title,
      category: article.category,
      excerpt: article.excerpt,
      bodyMarkdown: article.bodyMarkdown,
      version: article.version,
      productVersion: article.productVersion,
      updatedAt: article.updatedAt.toISOString(),
      sortOrder: article.sortOrder,
    }));
  const articles = mergeManualArticles(staticArticles(), databaseArticles);

  if (!product && !articles.length) {
    notFound();
  }

  return (
    <ProductDocsManual
      productName={product?.name || "MxF Factions"}
      productSlug="mxf-factions"
      description="A practical owner manual for installing the plugin, configuring each major system, understanding how gameplay features operate, validating live behavior, and preparing a server for release."
      articles={articles}
    />
  );
}

function staticArticles(): ProductManualArticle[] {
  return sourceDocs.map((article) => ({
    id: `static-${article.slug}`,
    slug: article.slug,
    title: article.title,
    category: article.category,
    excerpt: article.excerpt,
    bodyMarkdown: article.bodyMarkdown,
    version: article.version,
    productVersion: article.productVersion,
    updatedAt: article.updatedAt,
    sortOrder: article.sortOrder,
  }));
}

function mergeManualArticles(staticManual: ProductManualArticle[], databaseArticles: ProductManualArticle[]) {
  const bySlug = new Map<string, ProductManualArticle>();

  for (const article of databaseArticles) {
    bySlug.set(article.slug, article);
  }

  for (const article of staticManual) {
    bySlug.set(article.slug, article);
  }

  return [...bySlug.values()].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || a.title.localeCompare(b.title));
}
