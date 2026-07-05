type Bucket = {
  count: number;
  resetAt: number;
};

export class MemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  check(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    if (existing.count >= limit) {
      return { ok: false, remaining: 0, resetAt: existing.resetAt };
    }

    existing.count += 1;
    return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt };
  }
}
