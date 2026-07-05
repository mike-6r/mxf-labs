import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getCurrentCustomer } from "@/lib/auth/customer";

export async function GET() {
  const [admin, customer] = await Promise.all([getCurrentAdmin(), getCurrentCustomer()]);
  return NextResponse.json({
    ok: true,
    admin: admin ? { id: admin.id, email: admin.email, role: admin.role } : null,
    customer: customer ? { id: customer.id, email: customer.email, discordId: customer.discordId } : null,
  });
}
