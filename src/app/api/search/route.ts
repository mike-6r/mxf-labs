import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { globalSearch } from "@/lib/search/global";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const rate = checkRateLimit(`search:${request.headers.get("x-forwarded-for") || "local"}`, 60);

  if (!rate.ok) {
    return NextResponse.json({ ok: false, message: "Too many search requests." }, { status: 429 });
  }

  const payload = await globalSearch(query);
  return NextResponse.json({ ok: true, query, ...payload });
}
