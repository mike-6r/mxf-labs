import { prisma } from "../services/prisma";
import type { WebsiteApiClient } from "../services/website-api";
import { toJson } from "../utils/json";

type ProductSnapshot = {
  name: string;
  slug: string;
  status: string;
  version: string;
};

export async function getLocalOwnership(discordId: string) {
  const customer = await prisma.customer.findFirst({
    where: { discordId },
    include: {
      licenses: { include: { product: true }, orderBy: { createdAt: "desc" } },
      orders: { include: { product: true }, orderBy: { createdAt: "desc" } },
    },
  });

  const products = new Map<string, ProductSnapshot>();

  for (const license of customer?.licenses || []) {
    if (license.product) {
      products.set(license.product.slug, {
        name: license.product.name,
        slug: license.product.slug,
        status: license.product.status,
        version: license.product.version,
      });
    }
  }

  for (const order of customer?.orders || []) {
    if (order.product) {
      products.set(order.product.slug, {
        name: order.product.name,
        slug: order.product.slug,
        status: order.product.status,
        version: order.product.version,
      });
    }
  }

  return {
    customer,
    products: [...products.values()],
    licenses: customer?.licenses || [],
  };
}

export async function getOwnership(website: WebsiteApiClient, discordId: string) {
  const apiResult = await website.ownership(discordId);

  if (apiResult.ok && apiResult.data.ok) {
    await prisma.botCachedCustomer.upsert({
      where: { discordId },
      update: {
        email: apiResult.data.customer?.email || null,
        name: apiResult.data.customer?.name || null,
        ownedProductsJson: toJson(apiResult.data.products.map((product) => product.slug)),
        licensesJson: toJson(apiResult.data.licenses),
        rawJson: toJson(apiResult.data),
        lastSyncedAt: new Date(),
      },
      create: {
        discordId,
        email: apiResult.data.customer?.email || null,
        name: apiResult.data.customer?.name || null,
        ownedProductsJson: toJson(apiResult.data.products.map((product) => product.slug)),
        licensesJson: toJson(apiResult.data.licenses),
        rawJson: toJson(apiResult.data),
        lastSyncedAt: new Date(),
      },
    });

    return {
      source: "website" as const,
      customer: apiResult.data.customer,
      products: apiResult.data.products,
      licenses: apiResult.data.licenses,
    };
  }

  const local = await getLocalOwnership(discordId);
  return {
    source: "local" as const,
    customer: local.customer
      ? {
          id: local.customer.id,
          email: local.customer.email,
          name: local.customer.name,
          discordId: local.customer.discordId,
        }
      : null,
    products: local.products,
    licenses: local.licenses.map((license) => ({
      key: license.key,
      status: license.status,
      productSlug: license.product?.slug || null,
      currentActivations: license.currentActivations,
      maxActivations: license.maxActivations,
    })),
  };
}

export async function validateLicense(website: WebsiteApiClient, input: { key: string; discordId?: string; productSlug?: string }) {
  const result = await website.checkLicense(input);
  if (result.ok && result.data.ok) {
    await prisma.botCachedLicense.upsert({
      where: { licenseKey: input.key },
      update: {
        discordId: input.discordId || result.data.customerDiscordId || null,
        productSlug: result.data.product || input.productSlug || null,
        status: result.data.valid ? "Active" : "Invalid",
        rawJson: toJson(result.data),
        lastSyncedAt: new Date(),
      },
      create: {
        licenseKey: input.key,
        discordId: input.discordId || result.data.customerDiscordId || null,
        productSlug: result.data.product || input.productSlug || null,
        status: result.data.valid ? "Active" : "Invalid",
        rawJson: toJson(result.data),
        lastSyncedAt: new Date(),
      },
    });
  }

  return result;
}

export async function requestLicenseReset(input: { guildId: string; discordId: string; licenseKey: string; reason: string }) {
  return prisma.botSyncQueue.create({
    data: {
      guildId: input.guildId,
      eventType: "license.reset_requested",
      payloadJson: toJson(input),
      status: "Queued",
    },
  });
}
