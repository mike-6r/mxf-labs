import { getCurrentAdmin } from "@/lib/auth/admin";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";

export type SearchResult = {
  type: string;
  title: string;
  description: string;
  href: string;
  visibility: "public" | "customer" | "admin";
};

export async function globalSearch(query: string) {
  const term = query.trim();
  if (term.length < 2) {
    return { results: [] as SearchResult[], context: { admin: false, customer: false } };
  }

  const [admin, customer] = await Promise.all([getCurrentAdmin(), getCurrentCustomer()]);
  const [products, projects, docs, changelog] = await Promise.all([
    prisma.product.findMany({
      where: {
        visible: true,
        OR: [{ name: { contains: term } }, { shortDescription: { contains: term } }, { category: { contains: term } }],
      },
      take: 8,
    }),
    prisma.project.findMany({
      where: {
        visible: true,
        OR: [{ title: { contains: term } }, { description: { contains: term } }, { category: { contains: term } }],
      },
      take: 8,
    }),
    prisma.documentationArticle.findMany({
      where: {
        visible: true,
        OR: [{ title: { contains: term } }, { excerpt: { contains: term } }, { category: { contains: term } }],
      },
      take: 8,
    }),
    prisma.changelogEntry.findMany({
      where: {
        visible: true,
        OR: [{ title: { contains: term } }, { body: { contains: term } }, { type: { contains: term } }],
      },
      take: 8,
    }),
  ]);

  const results: SearchResult[] = [
    ...products.map((item) => ({
      type: "Product",
      title: item.name,
      description: item.shortDescription,
      href: `/products/${item.slug}`,
      visibility: "public" as const,
    })),
    ...projects.map((item) => ({
      type: "Project",
      title: item.title,
      description: item.description,
      href: `/projects/${item.slug}`,
      visibility: "public" as const,
    })),
    ...docs.map((item) => ({
      type: "Docs",
      title: item.title,
      description: item.excerpt,
      href: `/docs/${item.slug}`,
      visibility: "public" as const,
    })),
    ...changelog.map((item) => ({
      type: "Changelog",
      title: item.title,
      description: item.body,
      href: "/changelog",
      visibility: "public" as const,
    })),
  ];

  if (customer) {
    const [orders, licenses, tickets] = await Promise.all([
      prisma.order.findMany({
        where: {
          customerId: customer.id,
          OR: [{ status: { contains: term } }, { provider: { contains: term } }, { product: { name: { contains: term } } }],
        },
        include: { product: true },
        take: 6,
      }),
      prisma.license.findMany({
        where: {
          customerId: customer.id,
          OR: [{ key: { contains: term } }, { status: { contains: term } }, { product: { name: { contains: term } } }],
        },
        include: { product: true },
        take: 6,
      }),
      prisma.supportTicket.findMany({
        where: {
          customerId: customer.id,
          OR: [{ ticketNumber: { contains: term } }, { subject: { contains: term } }, { status: { contains: term } }],
        },
        take: 6,
      }),
    ]);

    results.push(
      ...orders.map((item) => ({
        type: "Order",
        title: item.product?.name || "Order",
        description: `${item.status} / ${item.provider}`,
        href: "/portal/orders",
        visibility: "customer" as const,
      })),
      ...licenses.map((item) => ({
        type: "License",
        title: item.product?.name || "License",
        description: `${item.status} / ${item.key}`,
        href: "/portal/licenses",
        visibility: "customer" as const,
      })),
      ...tickets.map((item) => ({
        type: "Support Ticket",
        title: item.ticketNumber,
        description: `${item.status} / ${item.subject}`,
        href: "/portal/support",
        visibility: "customer" as const,
      })),
    );
  }

  if (admin) {
    const [customers, orders, tickets, licenses] = await Promise.all([
      prisma.customer.findMany({
        where: {
          OR: [{ name: { contains: term } }, { email: { contains: term } }, { discordUsername: { contains: term } }],
        },
        take: 6,
      }),
      prisma.order.findMany({
        where: {
          OR: [{ status: { contains: term } }, { provider: { contains: term } }, { product: { name: { contains: term } } }],
        },
        include: { product: true, customer: true },
        take: 6,
      }),
      prisma.supportTicket.findMany({
        where: {
          OR: [{ ticketNumber: { contains: term } }, { subject: { contains: term } }, { email: { contains: term } }],
        },
        take: 6,
      }),
      prisma.license.findMany({
        where: {
          OR: [{ key: { contains: term } }, { status: { contains: term } }, { product: { name: { contains: term } } }],
        },
        include: { product: true, customer: true },
        take: 6,
      }),
    ]);

    results.push(
      ...customers.map((item) => ({
        type: "Customer",
        title: item.name,
        description: item.email,
        href: "/admin/customers",
        visibility: "admin" as const,
      })),
      ...orders.map((item) => ({
        type: "Admin Order",
        title: item.product?.name || item.id,
        description: `${item.customer?.email || "No customer"} / ${item.status}`,
        href: "/admin/orders",
        visibility: "admin" as const,
      })),
      ...tickets.map((item) => ({
        type: "Admin Ticket",
        title: item.ticketNumber,
        description: `${item.email} / ${item.subject}`,
        href: "/admin/support",
        visibility: "admin" as const,
      })),
      ...licenses.map((item) => ({
        type: "Admin License",
        title: item.product?.name || "License",
        description: `${item.customer?.email || "No customer"} / ${item.key}`,
        href: "/admin/licenses",
        visibility: "admin" as const,
      })),
    );
  }

  return { results, context: { admin: Boolean(admin), customer: Boolean(customer) } };
}
