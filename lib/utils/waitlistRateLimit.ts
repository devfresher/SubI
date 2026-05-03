const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 8;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function allowWaitlistSignup(clientKey: string): boolean {
  const now = Date.now();
  const b = buckets.get(clientKey);
  if (!b || now >= b.resetAt) {
    buckets.set(clientKey, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (b.count >= MAX_PER_WINDOW) return false;
  b.count += 1;
  return true;
}
