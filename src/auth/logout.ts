import { apiClient } from "../utils/api";
import { clearSession, getSession } from "./session";

let pendingRequests: AbortController[] = [];

export function registerPendingRequest(controller: AbortController): void {
  pendingRequests.push(controller);
}

export function cancelAllPendingRequests(): void {
  pendingRequests.forEach((c) => c.abort());
  pendingRequests = [];
}

export async function logout(): Promise<void> {
  const session = getSession();

  cancelAllPendingRequests();

  if (session?.token) {
    try {
      await apiClient.post("/auth/logout", {}, { token: session.token });
    } catch {
      // best-effort server-side invalidation; always clear locally
    }
  }

  clearSession();
  window.location.href = "/login";
}
