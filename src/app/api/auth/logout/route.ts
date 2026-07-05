import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE, hashSessionValue } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;

  if (sessionValue) {
    await prisma.customerSession.deleteMany({
      where: { tokenHash: await hashSessionValue(sessionValue) },
    });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(CUSTOMER_SESSION_COOKIE);
  return response;
}
