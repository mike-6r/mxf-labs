import { NextResponse } from "next/server";
import { requireCustomerApi } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";
import { createDownloadToken, consumeDownloadToken } from "@/lib/downloads/tokens";
import { evaluateDownloadActivity } from "@/lib/license/server";
import { requestIp } from "@/lib/request/ip";
import { getStorageProvider } from "@/lib/storage/providers";

type Params = { params: Promise<{ fileId: string }> };

const paidStatuses = ["Paid", "Fulfilled"];

function hasUsableLicense(license: { expirationDate: Date | null } | null) {
  return Boolean(license && (!license.expirationDate || license.expirationDate > new Date()));
}

async function deny(downloadId: string | undefined, customerId: string | undefined, request: Request, message: string, status = 403) {
  await prisma.downloadEvent.create({
    data: {
      downloadId,
      customerId,
      ipAddress: requestIp(request),
      userAgent: request.headers.get("user-agent"),
      status: `Denied: ${message}`,
    },
  });

  return NextResponse.json({ ok: false, message }, { status });
}

export async function GET(request: Request, { params }: Params) {
  const { customer, response } = await requireCustomerApi();
  if (response) return response;

  const { fileId } = await params;
  const download = await prisma.productDownload.findUnique({
    where: { id: fileId },
    include: { product: true, release: true },
  });

  if (!download || !download.visible) {
    return deny(undefined, customer.id, request, "Download not found.", 404);
  }

  const [order, license] = await Promise.all([
    prisma.order.findFirst({
      where: {
        customerId: customer.id,
        productId: download.productId,
        status: { in: paidStatuses },
      },
    }),
    prisma.license.findFirst({
      where: {
        customerId: customer.id,
        productId: download.productId,
        status: "Active",
        blacklisted: false,
      },
    }),
  ]);
  const licensed = hasUsableLicense(license);

  if (!order && !licensed) {
    return deny(download.id, customer.id, request, "An active license or paid order is required for this download.");
  }

  if (download.requiresLicense && !licensed) {
    return deny(download.id, customer.id, request, "An active license is required for this download.");
  }

  if (license && license.currentActivations > license.maxActivations) {
    return deny(download.id, customer.id, request, "License activation state is invalid.");
  }

  const url = new URL(request.url);
  const tokenValue = url.searchParams.get("token");

  if (!tokenValue) {
    const token = await createDownloadToken({
      customerId: customer.id,
      downloadId: download.id,
      ipAddress: requestIp(request),
      userAgent: request.headers.get("user-agent"),
    });
    const redirectUrl = new URL(request.url);
    redirectUrl.searchParams.set("token", token);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const token = await consumeDownloadToken({
    token: tokenValue,
    customerId: customer.id,
    downloadId: download.id,
  });

  if (!token) {
    return deny(download.id, customer.id, request, "Download link expired or already used.", 403);
  }

  let file = null;

  try {
    const provider = getStorageProvider();
    file = await provider.getFile(download.storageKey, download.filename, download.fileType);
  } catch {
    return deny(download.id, customer.id, request, "Storage provider is not configured.", 503);
  }

  if (!file) {
    return deny(download.id, customer.id, request, "Private file is not available.", 404);
  }

  await prisma.downloadEvent.create({
    data: {
      downloadId: download.id,
      customerId: customer.id,
      tokenId: token.id,
      ipAddress: requestIp(request),
      userAgent: request.headers.get("user-agent"),
      status: "Allowed",
    },
  });

  await evaluateDownloadActivity({
    customerId: customer.id,
    productId: download.productId,
    downloadId: download.id,
    ipAddress: requestIp(request),
  });

  return new Response(file.stream, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.size),
      "Content-Disposition": `attachment; filename="${file.filename.replaceAll("\"", "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
