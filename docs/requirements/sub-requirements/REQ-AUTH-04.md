---
id: REQ-AUTH-04
title: Proactive token refresh
epic: AUTH
milestone: M1
priority: high
status: in-progress
---

When a session token has less than 5 minutes remaining before expiry, the client must proactively refresh it in the background without interrupting the user's session.

Rules:
- A token is considered "needing refresh" when `expiresAt - now < 300_000ms` AND the session is not already expired.
- If two parts of the application trigger a refresh simultaneously, only one HTTP call must be made. The second caller must wait for the first call's result rather than issuing a duplicate request.
- The refresh must be retried up to 3 times on failure, with exponential backoff starting at 1 second (1s, 2s, 4s).
- If all 3 attempts fail, the session must be cleared and the user redirected to `/login` with a `?redirect=` parameter.
- On success, the new token and new `expiresAt` must replace the old session values in localStorage.
