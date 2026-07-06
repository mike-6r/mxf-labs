import { NextResponse } from "next/server";
import { getPlatformHealth } from "@/lib/health/checks";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getPlatformHealth();

  return NextResponse.json(health, {
    status: health.state === "unhealthy" ? 503 : 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
