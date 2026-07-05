import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { projectSchema } from "@/lib/validation/schemas";

function toProjectData(data: ReturnType<typeof projectSchema.parse>) {
  return {
    title: data.title,
    slug: data.slug,
    category: data.category,
    description: data.description,
    techStackJson: JSON.stringify(data.techStack),
    status: data.status,
    previewLink: data.previewLink || null,
    repositoryLabel: data.repositoryLabel || null,
    caseStudy: data.caseStudy,
    featured: data.featured,
    visible: data.visible,
  };
}

export async function GET() {
  const { response } = await requireAdminApi("projects.manage");

  if (response) return response;

  const projects = await prisma.project.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ ok: true, projects });
}

export async function POST(request: Request) {
  const { admin, response } = await requireAdminApi("projects.manage");

  if (response) return response;

  const parsed = projectSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid project." }, { status: 400 });
  }

  const project = await prisma.project.create({ data: toProjectData(parsed.data) });

  await logActivity({
    actorEmail: admin.email,
    action: "created project",
    entityType: "Project",
    entityId: project.id,
    metadata: { title: project.title },
  });

  return NextResponse.json({ ok: true, project }, { status: 201 });
}
