import { NextResponse } from "next/server";
import { requestIp } from "@/lib/request/ip";
import { checkRateLimit } from "@/lib/rate-limit";
import { licenseDeactivationSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const ipAddress = requestIp(request);
  const rate = checkRateLimit(`license-deactivate:${ipAddress}`, 40);

  if (!rate.ok) {
    return NextResponse.json({ ok: false, message: "Rate limited." }, { status: 429 });
  }

  const parsed = licenseDeactivationSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid deactivation request." }, { status: 400 });
  }

  const license = await prisma.license.findUnique({ where: { key: parsed.data.key } });

  if (!license) {
    return NextResponse.json({ ok: true, deactivated: false, reason: "not_found" });
  }

  await prisma.licenseActivation.updateMany({
    where: {
      licenseId: license.id,
      deviceId: parsed.data.deviceId,
      instanceId: parsed.data.instanceId,
    },
    data: { status: "Deactivated", lastSeenAt: new Date(), ipAddress },
  });

  const currentActivations = await prisma.licenseActivation.count({
    where: { licenseId: license.id, status: "Active" },
  });
  await prisma.license.update({ where: { id: license.id }, data: { currentActivations } });

  return NextResponse.json({ ok: true, deactivated: true });
}
