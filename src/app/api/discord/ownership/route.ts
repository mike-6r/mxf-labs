import { NextResponse } from "next/server";
import { requireDiscordBot } from "@/lib/auth/bot";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const unauthorized = requireDiscordBot(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const discordId = typeof body.discordId === "string" ? body.discordId.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!discordId && !email) {
    return NextResponse.json({ ok: false, message: "discordId or email is required." }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: discordId ? { discordId } : { email },
    include: {
      licenses: { include: { product: true }, orderBy: { createdAt: "desc" } },
      orders: { include: { product: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) {
    return NextResponse.json({ ok: true, customer: null, products: [], licenses: [] });
  }

  const products = new Map<string, { name: string; slug: string; status: string; version: string }>();

  for (const license of customer.licenses) {
    if (license.product) {
      products.set(license.product.slug, {
        name: license.product.name,
        slug: license.product.slug,
        status: license.product.status,
        version: license.product.version,
      });
    }
  }

  for (const order of customer.orders.filter((item) => ["Paid", "Fulfilled"].includes(item.status))) {
    if (order.product) {
      products.set(order.product.slug, {
        name: order.product.name,
        slug: order.product.slug,
        status: order.product.status,
        version: order.product.version,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      discordId: customer.discordId,
    },
    products: [...products.values()],
    licenses: customer.licenses.map((license) => ({
      key: license.key,
      status: license.status,
      productSlug: license.product?.slug || null,
      currentActivations: license.currentActivations,
      maxActivations: license.maxActivations,
    })),
  });
}
