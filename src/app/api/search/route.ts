import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request/ip";
import { globalSearch } from "@/lib/search/global";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const rate = checkRateLimit(`search:${requestIp(request)}`, 60);

  if (!rate.ok) {
    return rateLimitedResponse("Too many search requests.", rate);
  }

  const payload = await globalSearch(query);
  return NextResponse.json({ ok: true, query, ...payload });
}
