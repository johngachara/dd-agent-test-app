# Architecture

## Overview

Single-page React application with TypeScript. No framework router — navigation is handled via direct `window.location` assignments. API calls go through a thin `apiClient` wrapper in `src/utils/api.ts`.

## Layers

```
src/
  auth/       Session lifecycle, login, logout
  user/       Profile reads and updates, avatar upload
  components/ React form components (LoginForm, ProfileForm)
  utils/      Shared validators, apiClient wrapper
```

## Session storage

Session data lives in `localStorage` under three keys:
- `session_token` — bearer token for API calls
- `session_expires_at` — absolute Unix ms from server
- `session_last_active` — Unix ms of last user activity (inactivity timer)

## API

All requests go to `VITE_API_URL` (env var). The client attaches `Authorization: Bearer <token>` when a session exists. On non-2xx responses the client throws with the response body text as the message.
