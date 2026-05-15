---
id: REQ-AUTH-02
title: Session expiry redirect
epic: AUTH
milestone: M1
priority: high
status: in-progress
---

A user's session expires after 30 minutes of inactivity or when the server-issued token expiry time is reached, whichever comes first.

When a session is detected as expired:
1. All local session data (token, expiry timestamp, last-active timestamp) must be cleared from localStorage.
2. The user must be redirected to `/login`.
3. The redirect URL must include a `?redirect=` query parameter whose value is the URL-encoded current path + search string, so the user can be sent back after re-authenticating.
4. Activity (any navigation or interaction) must reset the inactivity timer by updating the `session_last_active` key in localStorage.
5. The check must run on every navigation event, not just on page load.
