import { prisma } from "@/lib/db/prisma";
import { logCustomerActivity } from "@/lib/db/customer-activity";
import { getSetting } from "@/lib/db/settings";
import { sendTemplateEmail } from "@/lib/email/resend";
import { generateLicenseKey } from "@/lib/license/generate";

async function uniqueLicenseKey() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const key = generateLicenseKey();
    const existing = await prisma.license.findUnique({ where: { key } });

    if (!existing) {
      return key;
    }
  }

  throw new Error("Unable to generate a unique license key.");
}

export async function fulfillPaidOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, product: true },
  });

  if (!order || !order.customerId || !order.productId) {
    return null;
  }

  const existingLicense = await prisma.license.findFirst({
    where: { customerId: order.customerId, productId: order.productId, notes: { contains: order.id } },
  });
  const defaultLicenseType = await getSetting("licenses.default_type");

  const license =
    existingLicense ||
    (await prisma.license.create({
      data: {
        key: await uniqueLicenseKey(),
        customerId: order.customerId,
        productId: order.productId,
        status: "Active",
        licenseType: defaultLicenseType || "Lifetime",
        minimumVersion: order.product?.version || null,
        maxActivations: order.product?.defaultActivationLimit || 3,
        notes: `Generated from order ${order.id}`,
      },
    }));

  const invoiceNumber = `MXF-INV-${order.id.slice(-8).toUpperCase()}`;
  await prisma.invoice.upsert({
    where: { orderId: order.id },
    update: {
      customerId: order.customerId,
      amountCents: order.amountCents,
      taxCents: order.taxCents,
      totalCents: order.amountCents + order.taxCents,
      currency: order.currency,
      status: "Paid",
      paidAt: new Date(),
    },
    create: {
      invoiceNumber,
      orderId: order.id,
      customerId: order.customerId,
      amountCents: order.amountCents,
      taxCents: order.taxCents,
      totalCents: order.amountCents + order.taxCents,
      currency: order.currency,
      status: "Paid",
      paidAt: new Date(),
    },
  });

  await prisma.customerNotification.create({
    data: {
      customerId: order.customerId,
      title: "License delivered",
      body: `${order.product?.name || "Your product"} is now active in your portal.`,
      type: "License",
    },
  });

  await logCustomerActivity({
    customerId: order.customerId,
    action: "purchase fulfilled",
    entityType: "Order",
    entityId: order.id,
    metadata: { productId: order.productId, licenseId: license.id },
  });

  await prisma.activityLog.create({
    data: {
      actorEmail: "system",
      action: "fulfilled paid order",
      entityType: "Order",
      entityId: order.id,
      metadata: JSON.stringify({ productId: order.productId, customerId: order.customerId, licenseId: license.id }),
    },
  });

  if (order.customer?.email) {
    await sendTemplateEmail({
      to: order.customer.email,
      template: "purchase_receipt",
      data: {
        productName: order.product?.name,
        orderId: order.id,
      },
    });
    await sendTemplateEmail({
      to: order.customer.email,
      template: "license_delivery",
      data: {
        productName: order.product?.name,
        licenseKey: license.key,
      },
    });
    await sendTemplateEmail({
      to: order.customer.email,
      template: "invoice",
      data: {
        productName: order.product?.name,
        orderId: order.id,
      },
    });
    await sendTemplateEmail({
      to: order.customer.email,
      template: "download_ready",
      data: {
        productName: order.product?.name,
      },
    });
  }

  return license;
}
