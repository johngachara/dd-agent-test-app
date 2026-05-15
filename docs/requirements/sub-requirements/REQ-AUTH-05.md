---
id: REQ-AUTH-05
title: Password reset flow
epic: AUTH
milestone: M1
priority: high
status: planned
---

The password reset flow has three stages: request, validate, and confirm.

Request stage:
- The email field must be validated before the API call. An invalid email returns an error without making any network request.

Validate stage:
- A reset token is valid only if it was issued within the last 15 minutes (900,000ms). An expired token must return the error "Reset token has expired. Please request a new one."
- A token with fewer than 8 characters must return "Invalid reset token".

Confirm stage:
- The new password must be at least 8 characters.
- The new password and confirmation password must match exactly. Mismatch returns "Passwords do not match".
- The new password must not match any of the user's last 5 passwords. If it does, return "Cannot reuse any of your last 5 passwords".
- All validations run before any API call is made.
