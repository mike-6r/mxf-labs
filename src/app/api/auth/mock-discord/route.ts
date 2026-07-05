import { NextResponse } from "next/server";
import { createCustomerSession, setCustomerSessionCookie } from "@/lib/auth/customer";
import { logCustomerActivity } from "@/lib/db/customer-activity";
import { prisma } from "@/lib/db/prisma";
import { sendTemplateEmail } from "@/lib/email/resend";
import { requestIp } from "@/lib/request/ip";

function mockLoginAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.MOCK_PROVIDERS_ENABLED === "true";
}

async function login(request: Request) {
  if (!mockLoginAllowed()) {
    return NextResponse.json({ ok: false, message: "Mock Discord login is disabled." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const discordId = String(body.discordId || process.env.MOCK_DISCORD_ID || "111111111111111111");
  const username = String(body.username || process.env.MOCK_DISCORD_USERNAME || "local.tester");
  const globalName = String(body.globalName || process.env.MOCK_DISCORD_GLOBAL_NAME || "Local Tester");
  const email = String(body.email || process.env.MOCK_DISCORD_EMAIL || "local.customer@mxf-labs.test");
  const returnTo = String(body.returnTo || "/portal");

  const existing =
    (await prisma.customer.findFirst({ where: { discordId } })) ||
    (await prisma.customer.findUnique({ where: { email } }));

  const customer = existing
    ? await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name: globalName,
          email,
          discordId,
          discordUsername: username,
          discordGlobalName: globalName,
          discordEmail: email,
          discordLinkedAt: existing.discordLinkedAt || new Date(),
          discordLastSyncedAt: new Date(),
          discordSyncStatus: "Mock Connected",
        },
      })
    : await prisma.customer.create({
        data: {
          name: globalName,
          email,
          discordId,
          discordUsername: username,
          discordGlobalName: globalName,
          discordEmail: email,
          discordLinkedAt: new Date(),
          discordLastSyncedAt: new Date(),
          discordSyncStatus: "Mock Connected",
        },
      });

  await Promise.all([
    logCustomerActivity({
      customerId: customer.id,
      action: "logged in with mock Discord",
      entityType: "Customer",
      entityId: customer.id,
      metadata: { discordId },
    }),
    prisma.customerLoginEvent.create({
      data: {
        customerId: customer.id,
        provider: "Mock Discord",
        ipAddress: requestIp(request),
        userAgent: request.headers.get("user-agent"),
        status: "Success",
      },
    }),
  ]);

  if (!existing) {
    await Promise.all([
      sendTemplateEmail({ to: email, template: "account_created", data: { customerName: globalName } }),
      sendTemplateEmail({ to: email, template: "welcome", data: { customerName: globalName } }),
    ]);
  }

  const sessionValue = await createCustomerSession(customer);
  const acceptsJson = request.headers.get("accept")?.includes("application/json");
  const response = acceptsJson
    ? NextResponse.json({ ok: true, customer, returnTo })
    : NextResponse.redirect(new URL(returnTo, request.url));
  setCustomerSessionCookie(response, sessionValue);
  return response;
}

export async function GET(request: Request) {
  return login(request);
}

export async function POST(request: Request) {
  return login(request);
}
