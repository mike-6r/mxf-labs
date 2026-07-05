import { getContentMode, isDemoText, shouldShowDemoData } from "@/lib/content-mode";
import { isPlaceholderContent } from "@/lib/content-quality";
import { prisma } from "@/lib/db/prisma";
import { serializeProduct, serializeProject } from "@/lib/db/serializers";
import { getSetting } from "@/lib/db/settings";
import { CLEAN_HIDDEN_PRODUCT_STATUSES, PUBLIC_PRODUCT_STATUSES } from "@/lib/products/status";

function isPublicReadyText(...values: Array<string | null | undefined>) {
  return !isDemoText(...values) && !isPlaceholderContent(...values);
}

export async function getPublicProducts() {
  const mode = await getContentMode();
  const featuredSlug = await getSetting("products.featured_slug");
  const products = await prisma.product.findMany({
    where: {
      visible: true,
      ...(mode === "production" ? { status: { in: [...PUBLIC_PRODUCT_STATUSES] } } : {}),
      ...(mode === "clean" ? { status: { notIn: [...CLEAN_HIDDEN_PRODUCT_STATUSES] } } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  const visibleProducts = mode === "demo"
    ? products
    : products.filter((product) => isPublicReadyText(product.name, product.shortDescription, product.fullDescription));

  return visibleProducts
    .sort((a, b) => Number(b.slug === featuredSlug) - Number(a.slug === featuredSlug))
    .map(serializeProduct);
}

export async function getPublicProduct(slug: string) {
  const mode = await getContentMode();
  const product = await prisma.product.findFirst({
    where: {
      slug,
      visible: true,
      ...(mode === "production" ? { status: { in: [...PUBLIC_PRODUCT_STATUSES] } } : {}),
      ...(mode === "clean" ? { status: { notIn: [...CLEAN_HIDDEN_PRODUCT_STATUSES] } } : {}),
    },
  });

  if (!product) return null;
  if (mode !== "demo" && !isPublicReadyText(product.name, product.shortDescription, product.fullDescription)) return null;
  return serializeProduct(product);
}

export async function getPublicProjects() {
  const mode = await getContentMode();
  const projects = await prisma.project.findMany({
    where: {
      visible: true,
      ...(mode !== "demo" ? { status: { not: "Concept" } } : {}),
    },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
  });

  return projects.map(serializeProject);
}

export async function getPublicProject(slug: string) {
  const mode = await getContentMode();
  const project = await prisma.project.findFirst({
    where: {
      slug,
      visible: true,
      ...(mode !== "demo" ? { status: { not: "Concept" } } : {}),
    },
  });

  return project ? serializeProject(project) : null;
}

export async function getPublicAnnouncements() {
  const mode = await getContentMode();
  const announcements = await prisma.announcement.findMany({
    where: {
      active: true,
      visibility: "Public",
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return shouldShowDemoData(mode)
    ? announcements
    : announcements.filter((announcement) => isPublicReadyText(announcement.title, announcement.body, announcement.type));
}

export async function getPublicDocumentationArticles(query = "") {
  const mode = await getContentMode();
  const articles = await prisma.documentationArticle.findMany({
    where: {
      visible: true,
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { category: { contains: query } },
              { excerpt: { contains: query } },
              { bodyMarkdown: { contains: query } },
            ],
          }
        : {}),
    },
    include: { product: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
  });

  return shouldShowDemoData(mode)
    ? articles
    : articles.filter((article) => isPublicReadyText(article.title, article.excerpt, article.bodyMarkdown, article.product?.name));
}

export async function getPublicDocumentationArticle(slug: string) {
  const mode = await getContentMode();
  const article = await prisma.documentationArticle.findUnique({
    where: { slug },
    include: { product: true },
  });

  if (!article || !article.visible) return null;
  if (mode !== "demo" && !isPublicReadyText(article.title, article.excerpt, article.bodyMarkdown, article.product?.name)) return null;
  return article;
}
