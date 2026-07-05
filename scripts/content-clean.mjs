import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const obsoleteSlugs = ["ticket-plus", "licensegrid", "realm-ops", "addon-forge"];
const obsoleteNames = ["Ticket Plus", "LicenseGrid", "Realm Ops", "Addon Forge"];
const launchProjectSlugs = ["mxf-factions", "mxf-prisons", "mxf-skyblock", "mxf-aio-bot", "mxf-labs-website", "mxf-api-platform"];

async function main() {
  const obsoleteProducts = await prisma.product.findMany({
    where: { slug: { in: obsoleteSlugs } },
    select: { id: true, slug: true, name: true },
  });
  const obsoleteProductIds = obsoleteProducts.map((product) => product.id);

  const [products, obsoleteProjects, nonLaunchProjects, docsByProduct, docsByText, downloads, releases, changelogByProduct, changelogByText, announcements] = await Promise.all([
    prisma.product.updateMany({
      where: { slug: { in: obsoleteSlugs } },
      data: { visible: false, status: "Archived", purchaseButtonText: "Archived" },
    }),
    prisma.project.updateMany({
      where: {
        OR: [
          { slug: { in: obsoleteSlugs } },
          ...obsoleteNames.map((name) => ({ title: { contains: name } })),
        ],
      },
      data: { visible: false, status: "Archived" },
    }),
    prisma.project.updateMany({
      where: {
        slug: { notIn: launchProjectSlugs },
      },
      data: { visible: false, status: "Archived" },
    }),
    obsoleteProductIds.length
      ? prisma.documentationArticle.updateMany({
          where: { productId: { in: obsoleteProductIds } },
          data: { visible: false },
        })
      : Promise.resolve({ count: 0 }),
    prisma.documentationArticle.updateMany({
      where: {
        OR: [
          ...obsoleteSlugs.map((slug) => ({ slug: { contains: slug } })),
          ...obsoleteNames.flatMap((name) => [{ title: { contains: name } }, { excerpt: { contains: name } }, { bodyMarkdown: { contains: name } }]),
        ],
      },
      data: { visible: false },
    }),
    obsoleteProductIds.length
      ? prisma.productDownload.updateMany({
          where: { productId: { in: obsoleteProductIds } },
          data: { visible: false },
        })
      : Promise.resolve({ count: 0 }),
    obsoleteProductIds.length
      ? prisma.productRelease.updateMany({
          where: { productId: { in: obsoleteProductIds } },
          data: { status: "Archived", isLatest: false },
        })
      : Promise.resolve({ count: 0 }),
    obsoleteProductIds.length
      ? prisma.changelogEntry.updateMany({
          where: { productId: { in: obsoleteProductIds } },
          data: { visible: false },
        })
      : Promise.resolve({ count: 0 }),
    prisma.changelogEntry.updateMany({
      where: {
        OR: [
          ...obsoleteSlugs.map((slug) => ({ slug: { contains: slug } })),
          ...obsoleteNames.flatMap((name) => [{ title: { contains: name } }, { body: { contains: name } }]),
        ],
      },
      data: { visible: false },
    }),
    prisma.announcement.updateMany({
      where: {
        OR: obsoleteNames.flatMap((name) => [{ title: { contains: name } }, { body: { contains: name } }]),
      },
      data: { active: false, visibility: "Admin only" },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        archived: {
          products: products.count,
          projects: obsoleteProjects.count + nonLaunchProjects.count,
          docs: docsByProduct.count + docsByText.count,
          downloads: downloads.count,
          releases: releases.count,
          changelog: changelogByProduct.count + changelogByText.count,
          announcements: announcements.count,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
