import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const { admin, response } = await requireAdminApi("settings.manage");
  if (response) return response;

  const body = await request.json().catch(() => null);
  const updates = Array.isArray(body?.settings) ? body.settings : null;

  if (!updates) {
    return NextResponse.json({ ok: false, message: "Expected settings array." }, { status: 400 });
  }

  const saved = [];

  for (const update of updates) {
    if (!update || typeof update.key !== "string" || typeof update.value !== "string") continue;

    const setting = await prisma.platformSetting.upsert({
      where: { key: update.key },
      update: {
        value: update.value,
        description: typeof update.description === "string" ? update.description : undefined,
      },
      create: {
        key: update.key,
        value: update.value,
        description: typeof update.description === "string" ? update.description : "",
      },
    });
    saved.push(setting);
  }

  await logActivity({
    actorEmail: admin.email,
    action: "updated platform settings",
    entityType: "PlatformSetting",
    metadata: { keys: saved.map((setting) => setting.key) },
  });

  return NextResponse.json({ ok: true, settings: saved });
}
