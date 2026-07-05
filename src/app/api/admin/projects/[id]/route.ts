import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { projectSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

function toPartialProjectData(data: Record<string, unknown>) {
  const mapped: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;

    if (key === "techStack") {
      mapped.techStackJson = JSON.stringify(value);
    } else if (key === "previewLink" || key === "repositoryLabel") {
      mapped[key] = value || null;
    } else {
      mapped[key] = value;
    }
  }

  return mapped;
}

export async function PATCH(request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("projects.manage");

  if (response) return response;

  const parsed = projectSchema.partial().safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid project update." }, { status: 400 });
  }

  const { id } = await params;
  const project = await prisma.project.update({ where: { id }, data: toPartialProjectData(parsed.data) });

  await logActivity({
    actorEmail: admin.email,
    action: "updated project",
    entityType: "Project",
    entityId: project.id,
    metadata: { title: project.title },
  });

  return NextResponse.json({ ok: true, project });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { admin, response } = await requireAdminApi("projects.manage");

  if (response) return response;

  const { id } = await params;
  await prisma.project.delete({ where: { id } });

  await logActivity({
    actorEmail: admin.email,
    action: "deleted project",
    entityType: "Project",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
