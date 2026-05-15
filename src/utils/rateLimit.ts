// Sliding-window client-side rate limiter.
// Tracks call timestamps per endpoint and blocks calls that exceed the limit.

export interface RateLimitConfig {
  maxCalls: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxCalls: 10,
  windowMs: 60_000,
};

// In-memory store: endpoint -> list of call timestamps (Unix ms)
const callLog = new Map<string, number[]>();

function getWindowStart(windowMs: number): number {
  return Date.now() - windowMs;
}

function pruneExpired(timestamps: number[], windowMs: number): number[] {
  const cutoff = getWindowStart(windowMs);
  return timestamps.filter((t) => t > cutoff);
}

export function checkRateLimit(
  endpoint: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
  const raw = callLog.get(endpoint) ?? [];
  const active = pruneExpired(raw, config.windowMs);
  callLog.set(endpoint, active);

  const remaining = config.maxCalls - active.length;

  if (active.length >= config.maxCalls) {
    // Oldest call in the window: once it ages out the next slot opens
    const oldestInWindow = Math.min(...active);
    const retryAfterMs = oldestInWindow + config.windowMs - Date.now();
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  return { allowed: true, remaining: remaining - 1 };
}

export function recordCall(endpoint: string): void {
  const existing = callLog.get(endpoint) ?? [];
  callLog.set(endpoint, [...existing, Date.now()]);
}

export function getRemainingCalls(
  endpoint: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): number {
  const raw = callLog.get(endpoint) ?? [];
  const active = pruneExpired(raw, config.windowMs);
  return Math.max(0, config.maxCalls - active.length);
}

export function resetEndpoint(endpoint: string): void {
  callLog.delete(endpoint);
}

export function resetAll(): void {
  callLog.clear();
}
