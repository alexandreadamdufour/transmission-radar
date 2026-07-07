// Simple in-memory per-IP rate limiter. Not distributed (each serverless
// instance has its own counter, resets on cold start) — good enough as a
// first line of defense without adding a Redis dependency (Upstash) for a
// v1 read-only public API. Swap for Upstash if abuse becomes a real problem.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  bucket.count += 1;
  const ok = bucket.count <= MAX_REQUESTS;
  return { ok, remaining: Math.max(0, MAX_REQUESTS - bucket.count), resetAt: bucket.resetAt };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
