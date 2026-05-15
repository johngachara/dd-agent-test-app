---
id: REQ-AUTH-03
title: Logout behaviour
epic: AUTH
milestone: M1
priority: medium
status: planned
---

When a user explicitly logs out:
1. All in-flight API requests must be cancelled immediately (via AbortController) before any cleanup runs.
2. The server logout endpoint (`POST /auth/logout`) must be called with the current session token to invalidate the session server-side.
3. Even if the server call fails (network error, 5xx), local session data must still be cleared.
4. After clearing session data, the user must be redirected to `/login` with no `?redirect=` parameter (logout is intentional).
