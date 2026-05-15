---
id: REQ-PROF-03
title: User preferences validation
epic: PROF
milestone: M2
priority: medium
status: planned
---

Users can update their preferences (theme, language, notifications) in any combination. Partial updates are allowed — only fields included in the payload are validated.

Validation rules:
- `theme` must be one of: `light`, `dark`, `system`. Any other value returns "Theme must be one of: light, dark, system".
- `language` must be one of: `en`, `fr`, `es`, `de`, `sw`. Any other value returns "Language must be one of: en, fr, es, de, sw".
- `notifications.digest` must be one of: `daily`, `weekly`, `never`.
- Cross-field rule: if `notifications.push` is `false`, then `notifications.digest` must be `"never"`. Violating this returns "Digest frequency must be 'never' when push notifications are disabled".

Merge behaviour:
- Updating preferences must merge with the existing values, not replace them wholesale.
- Updating `notifications` must merge the notification sub-fields individually — setting `push: false` must not reset `email` to its default.
