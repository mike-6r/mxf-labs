import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  CUSTOMER_SESSION_COOKIE,
  createCustomerSessionValue,
  CUSTOMER_SESSION_MAX_AGE_SECONDS,
  hashSessionValue,
  verifyCustomerSessionValue,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function getCurrentCustomer() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  const session = await verifyCustomerSessionValue(sessionValue);

  if (!session) {
    return null;
  }

  const storedSession = await prisma.customerSession.findFirst({
    where: {
      tokenHash: await hashSessionValue(sessionValue || ""),
      expiresAt: {
        gt: new Date(),
      },
      customer: {
        id: session.sub,
        email: session.email,
      },
    },
    include: {
      customer: true,
    },
  });

  return storedSession?.customer || null;
}

export async function createCustomerSession(customer: {
  id: string;
  email: string;
  discordId?: string | null;
}) {
  const sessionValue = await createCustomerSessionValue({
    customerId: customer.id,
    email: customer.email,
    discordId: customer.discordId,
  });

  await prisma.customerSession.create({
    data: {
      tokenHash: await hashSessionValue(sessionValue),
      customerId: customer.id,
      expiresAt: new Date(Date.now() + CUSTOMER_SESSION_MAX_AGE_SECONDS * 1000),
    },
  });

  return sessionValue;
}

export function setCustomerSessionCookie(response: NextResponse, sessionValue: string) {
  response.cookies.set(CUSTOMER_SESSION_COOKIE, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CUSTOMER_SESSION_MAX_AGE_SECONDS,
  });
}

export async function requireCustomerApi() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return {
      customer: null,
      response: NextResponse.json({ ok: false, message: "Customer authentication required." }, { status: 401 }),
    };
  }

  return { customer, response: null };
}
