import { NextResponse } from "next/server";
import { getSettings } from "@/lib/db/settings";

export async function GET() {
  const settings = await getSettings(["nav.enabled_items"]);
  return NextResponse.json({ ok: true, settings });
}
