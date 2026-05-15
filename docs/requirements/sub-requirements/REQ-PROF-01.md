---
id: REQ-PROF-01
title: Profile update validation
epic: PROF
milestone: M2
priority: high
status: planned
---

When a user submits a profile update:
1. If `name` is provided and is fewer than 2 characters, display "Name must be at least 2 characters". The form must not submit.
2. If `email` is provided and is not a valid email address, display "Please enter a valid email address". The form must not submit.
3. If `email` is changed (differs from the current stored email), the `currentPassword` field becomes required. If it is absent or empty, display "Current password is required to change email".
4. If `email` is unchanged, the `currentPassword` field must not be shown or validated.
5. Fields not included in the payload are not validated (partial updates are allowed).
