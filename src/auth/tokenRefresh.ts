import { apiClient } from "../utils/api";
import { getSession, setSession, handleExpiredSession, isSessionExpired } from "./session";

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // refresh if < 5 min remaining
const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 1000;

// Lock prevents two concurrent refresh calls racing each other
let refreshPromise: Promise<boolean> | null = null;

export function needsRefresh(): boolean {
  const session = getSession();
  if (!session) return false;
  const timeRemaining = session.expiresAt - Date.now();
  return timeRemaining > 0 && timeRemaining < REFRESH_THRESHOLD_MS;
}

async function attemptRefresh(attempt: number): Promise<boolean> {
  const session = getSession();
  if (!session) return false;

  try {
    const data = await apiClient.post<{ token: string; expiresAt: number }>(
      "/auth/refresh",
      { token: session.token }
    );
    setSession({ token: data.token, expiresAt: data.expiresAt });
    return true;
  } catch {
    if (attempt < MAX_ATTEMPTS) {
      const delay = BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
      return attemptRefresh(attempt + 1);
    }
    return false;
  }
}

export async function refreshToken(): Promise<boolean> {
  // If a refresh is already in flight, wait for it instead of making a second call
  if (refreshPromise) return refreshPromise;

  refreshPromise = attemptRefresh(1).finally(() => {
    refreshPromise = null;
  });

  const success = await refreshPromise;

  if (!success) {
    handleExpiredSession();
  }

  return success;
}

export async function ensureFreshToken(): Promise<boolean> {
  if (isSessionExpired()) {
    handleExpiredSession();
    return false;
  }
  if (needsRefresh()) {
    return refreshToken();
  }
  return true;
}
