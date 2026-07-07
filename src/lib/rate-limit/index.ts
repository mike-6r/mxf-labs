const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const current = hits.get(key);

  if (!current || current.resetAt < now) {
    const resetAt = now + windowMs;
    hits.set(key, { count: 1, resetAt });
    return { ok: true, limit, remaining: limit - 1, resetAt, retryAfter: Math.ceil(windowMs / 1000) };
  }

  if (current.count >= limit) {
    return { ok: false, limit, remaining: 0, resetAt: current.resetAt, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  return { ok: true, limit, remaining: limit - current.count, resetAt: current.resetAt, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}

export type RateLimitResult = ReturnType<typeof checkRateLimit>;

export function rateLimitHeaders(rate: RateLimitResult) {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(rate.limit),
    "X-RateLimit-Remaining": String(rate.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rate.resetAt / 1000)),
  };

  if (!rate.ok) {
    headers["Retry-After"] = String(rate.retryAfter);
  }

  return headers;
}

export function rateLimitedResponse(message: string, rate: RateLimitResult, extra: Record<string, unknown> = {}) {
  return Response.json(
    {
      ok: false,
      message,
      retryAfter: rate.retryAfter,
      ...extra,
    },
    {
      status: 429,
      headers: rateLimitHeaders(rate),
    },
  );
}
