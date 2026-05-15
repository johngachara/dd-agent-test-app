const SESSION_INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

export interface Session {
  token: string;
  expiresAt: number;
}

export function setSession(session: Session): void {
  localStorage.setItem("session_token", session.token);
  localStorage.setItem("session_expires_at", String(session.expiresAt));
  localStorage.setItem("session_last_active", String(Date.now()));
}

export function getSession(): Session | null {
  const token = localStorage.getItem("session_token");
  const expiresAt = localStorage.getItem("session_expires_at");
  if (!token || !expiresAt) return null;
  return { token, expiresAt: parseInt(expiresAt, 10) };
}

export function isSessionExpired(): boolean {
  const session = getSession();
  if (!session) return true;

  const lastActive = localStorage.getItem("session_last_active");
  if (!lastActive) return true;

  const inactiveDuration = Date.now() - parseInt(lastActive, 10);
  return inactiveDuration >= SESSION_INACTIVITY_MS || Date.now() >= session.expiresAt;
}

export function refreshActivity(): void {
  if (!isSessionExpired()) {
    localStorage.setItem("session_last_active", String(Date.now()));
  }
}

export function handleExpiredSession(): void {
  const currentPath = window.location.pathname + window.location.search;
  clearSession();
  window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
}

export function clearSession(): void {
  localStorage.removeItem("session_token");
  localStorage.removeItem("session_expires_at");
  localStorage.removeItem("session_last_active");
}

export function checkSessionOnNavigation(): void {
  if (isSessionExpired()) {
    handleExpiredSession();
  } else {
    refreshActivity();
  }
}
