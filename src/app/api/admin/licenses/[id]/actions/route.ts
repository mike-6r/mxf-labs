import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { requestAuditContext } from "@/lib/db/audit";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string }> };

const allowedActions = new Set(["activate", "suspend", "revoke", "reset-activations", "clear-ip-bindings", "append-note"]);

const licenseInclude = {
  customer: true,
  product: true,
  activations: { orderBy: { lastSeenAt: "desc" as const }, take: 5 },
  suspiciousFlags: { where: { status: "Open" }, orderBy: { createdAt: "desc" as const }, take: 5 },
  validations: { orderBy: { createdAt: "desc" as const }, take: 5 },
};

function bodyText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export async function POST(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("licenses.manage");

  if (response) return response;

  const body = await request.json().catch(() => ({}));
  const action = bodyText(body.action);
  const reason = bodyText(body.reason, "Admin license action");
  const { id } = await params;

  if (!allowedActions.has(action)) {
    return NextResponse.json({ ok: false, message: "Unsupported license action." }, { status: 400 });
  }

  const existing = await prisma.license.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ ok: false, message: "License not found." }, { status: 404 });
  }

  if (action === "reset-activations") {
    await prisma.licenseActivation.updateMany({
      where: { licenseId: id },
      data: { status: "Reset" },
    });
    await prisma.license.update({
      where: { id },
      data: {
        currentActivations: 0,
        resetCount: { increment: 1 },
        lastResetAt: new Date(),
        notes: `${existing.notes}\nAdmin reset activations: ${reason}`.trim(),
      },
    });
  }

  if (action === "clear-ip-bindings") {
    await prisma.licenseActivation.updateMany({
      where: { licenseId: id },
      data: { ipAddress: null },
    });
    await prisma.license.update({
      where: { id },
      data: {
        resetCount: { increment: 1 },
        lastResetAt: new Date(),
        notes: `${existing.notes}\nAdmin cleared IP bindings: ${reason}`.trim(),
      },
    });
  }

  if (action === "activate") {
    await prisma.license.update({
      where: { id },
      data: {
        status: "Active",
        blacklisted: false,
        blacklistedAt: null,
        notes: `${existing.notes}\nAdmin reactivated license: ${reason}`.trim(),
      },
    });
  }

  if (action === "suspend" || action === "revoke") {
    await prisma.license.update({
      where: { id },
      data: {
        status: action === "suspend" ? "Suspended" : "Revoked",
        blacklisted: action === "revoke" ? true : existing.blacklisted,
        blacklistedAt: action === "revoke" ? new Date() : existing.blacklistedAt,
        notes: `${existing.notes}\nAdmin ${action}: ${reason}`.trim(),
      },
    });
  }

  if (action === "append-note") {
    const note = bodyText(body.note);
    if (!note) {
      return NextResponse.json({ ok: false, message: "A note is required." }, { status: 400 });
    }

    await prisma.license.update({
      where: { id },
      data: {
        notes: `${existing.notes}\nAdmin note: ${note}`.trim(),
      },
    });
  }

  const license = await prisma.license.findUnique({
    where: { id },
    include: licenseInclude,
  });

  await logActivity({
    actorEmail: admin?.email,
    action: `license ${action}`,
    entityType: "License",
    entityId: id,
    metadata: {
      reason,
      ...requestAuditContext(request),
    },
  });

  return NextResponse.json({ ok: true, license });
}
