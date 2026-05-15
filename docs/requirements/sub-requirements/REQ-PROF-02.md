---
id: REQ-PROF-02
title: Avatar upload validation
epic: PROF
milestone: M2
priority: medium
status: planned
---

When a user selects a file to upload as their profile picture:
1. Only JPEG (`image/jpeg`) and PNG (`image/png`) MIME types are accepted. Any other type (GIF, WebP, PDF, etc.) must show the error "Only JPEG and PNG files are supported" and the upload must not proceed.
2. The file must be under 2MB (2 × 1024 × 1024 bytes). Files at exactly 2MB or larger must show "File must be under 2MB" and the upload must not proceed.
3. Validation must happen client-side before any network request is made.
4. A valid file must be uploaded via a `multipart/form-data` POST to `/users/{userId}/avatar` with the file in a field named `avatar`.
5. On success the API returns `{ avatarUrl: string }` which must be stored/reflected in the UI.
