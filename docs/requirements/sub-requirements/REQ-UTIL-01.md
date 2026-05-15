---
id: REQ-UTIL-01
title: Client-side rate limiting
epic: AUTH
milestone: M1
priority: medium
status: in-progress
---

All API endpoints must be protected by a client-side sliding-window rate limiter to prevent accidental flooding.

Default limits: 10 calls per 60-second window per endpoint.

Rules:
- `checkRateLimit(endpoint)` must return `{ allowed: true, remaining: N }` when the call count is below the limit.
- When the limit is reached, it must return `{ allowed: false, remaining: 0, retryAfterMs: N }` where `retryAfterMs` is the number of milliseconds until the oldest in-window call ages out.
- `retryAfterMs` must never be negative.
- Calls older than the window must not count toward the limit (sliding window, not fixed window).
- `recordCall` and `checkRateLimit` are separate operations — checking does not automatically record.
- `resetEndpoint` must clear the call history for a single endpoint without affecting others.
- Different endpoints must have completely independent counters.
