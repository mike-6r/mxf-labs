import { NextResponse } from "next/server";
import { logActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/resend";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request/ip";
import { escapeHtml } from "@/lib/security/html";
import { publicContactSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const ipAddress = requestIp(request);
  const rate = checkRateLimit(`contact:${ipAddress}`, 12);

  if (!rate.ok) {
    return rateLimitedResponse("Too many requests.", rate);
  }

  const parsed = publicContactSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid contact submission." }, { status: 400 });
  }

  const submission = await prisma.contactSubmission.create({
    data: parsed.data,
  });

  await logActivity({
    action: "received contact submission",
    entityType: "ContactSubmission",
    entityId: submission.id,
    metadata: { service: submission.service, budget: submission.budget, ipAddress },
  });

  await sendEmail({
    to: process.env.SUPPORT_EMAIL || "support@mxf-labs.com",
    subject: `New MxF Labs inquiry: ${submission.service}`,
    text: `${submission.name} (${submission.email}) submitted an inquiry for ${submission.service} with budget ${submission.budget}.\n\n${submission.description}`,
    html: `<div><h1>New MxF Labs inquiry</h1><p>${escapeHtml(submission.name)} (${escapeHtml(submission.email)})</p><p>${escapeHtml(submission.service)} / ${escapeHtml(submission.budget)}</p><p>${escapeHtml(submission.description)}</p></div>`,
  });

  return NextResponse.json(
    {
      ok: true,
      message: "Inquiry received.",
      id: submission.id,
      receivedAt: new Date().toISOString(),
    },
    { status: 201 },
  );
}
