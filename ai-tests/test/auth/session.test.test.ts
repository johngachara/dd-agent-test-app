/**
 * @requirement REQ-AUTH-02
 * @source docs/requirements/sub-requirements/REQ-AUTH-02.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  isSessionExpired,
  handleExpiredSession,
  clearSession,
  refreshActivity,
  checkSessionOnNavigation,
  setSession,
} from "../../../src/auth/session";

// In-memory mock for localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe("Session Management", () => {
  let locationMock: { href: string; pathname: string; search: string };

  beforeEach(() => {
    // @ts-ignore
    global.localStorage = createLocalStorageMock();
    locationMock = { href: "", pathname: "/dashboard", search: "?filter=active" };
    Object.defineProperty(global, "window", {
      value: { location: locationMock },
      writable: true,
    });
  });

  afterEach(() => {
    mock.restoreAll();
    // @ts-ignore
    delete global.localStorage;
    // @ts-ignore
    delete global.window;
  });

  describe("REQ-AUTH-02: Session Expiry", () => {
    const thirtyMinutesInMs = 30 * 60 * 1000;
    const now = Date.now();

    it("should detect session as expired after 30 minutes of inactivity", () => {
      const lastActive = now - thirtyMinutesInMs;
      const expiresAt = now + 10000; // Token itself is not expired
      localStorage.setItem("session_token", "test-token");
      localStorage.setItem("session_expires_at", String(expiresAt));
      localStorage.setItem("session_last_active", String(lastActive));

      mock.method(Date, "now", () => now);

      assert.ok(isSessionExpired(), "Session should be expired due to inactivity");
    });

    it("should detect session as expired when the server-issued token expiry is reached", () => {
      const lastActive = now - 10000; // Recently active
      const expiresAt = now - 1; // Token expired 1ms ago
      localStorage.setItem("session_token", "test-token");
      localStorage.setItem("session_expires_at", String(expiresAt));
      localStorage.setItem("session_last_active", String(lastActive));

      mock.method(Date, "now", () => now);

      assert.ok(isSessionExpired(), "Session should be expired due to token expiry");
    });

    it("should not be expired if both inactivity and token expiry are in the future", () => {
      const lastActive = now - 10000; // Recently active
      const expiresAt = now + thirtyMinutesInMs; // Token expires in 30 mins
      localStorage.setItem("session_token", "test-token");
      localStorage.setItem("session_expires_at", String(expiresAt));
      localStorage.setItem("session_last_active", String(lastActive));

      mock.method(Date, "now", () => now);

      assert.equal(isSessionExpired(), false, "Session should be valid");
    });

    it("REQ-AUTH-02.1: handleExpiredSession should clear all local session data", () => {
      localStorage.setItem("session_token", "test-token");
      localStorage.setItem("session_expires_at", "12345");
      localStorage.setItem("session_last_active", "67890");

      handleExpiredSession();

      assert.equal(localStorage.getItem("session_token"), null);
      assert.equal(localStorage.getItem("session_expires_at"), null);
      assert.equal(localStorage.getItem("session_last_active"), null);
    });

    it("REQ-AUTH-02.2 & REQ-AUTH-02.3: handleExpiredSession should redirect to /login with a redirect parameter", () => {
      const currentPath = "/dashboard?filter=active";
      const expectedRedirectUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;

      handleExpiredSession();

      assert.equal(locationMock.href, expectedRedirectUrl);
    });

    it("REQ-AUTH-02.4: refreshActivity should update the last-active timestamp", () => {
      const startTime = Date.now();
      const futureTime = startTime + 5000;
      setSession({ token: "test-token", expiresAt: startTime + thirtyMinutesInMs });
      assert.equal(localStorage.getItem("session_last_active"), String(startTime));

      mock.method(Date, "now", () => futureTime);
      refreshActivity();

      assert.equal(localStorage.getItem("session_last_active"), String(futureTime));
    });

    it("REQ-AUTH-02.5: checkSessionOnNavigation should handle expiry on navigation", () => {
      const isExpiredMock = mock.fn(isSessionExpired, () => true);
      const handleExpiredMock = mock.fn(handleExpiredSession, () => {});
      const refreshActivityMock = mock.fn(refreshActivity, () => {});

      checkSessionOnNavigation();

      assert.equal(isExpiredMock.mock.calls.length, 1);
      assert.equal(handleExpiredMock.mock.calls.length, 1);
      assert.equal(refreshActivityMock.mock.calls.length, 0);
    });

    it("REQ-AUTH-02.5: checkSessionOnNavigation should refresh activity on navigation if not expired", () => {
      const isExpiredMock = mock.fn(isSessionExpired, () => false);
      const handleExpiredMock = mock.fn(handleExpiredSession, () => {});
      const refreshActivityMock = mock.fn(refreshActivity, () => {});

      checkSessionOnNavigation();

      assert.equal(isExpiredMock.mock.calls.length, 1);
      assert.equal(handleExpiredMock.mock.calls.length, 0);
      assert.equal(refreshActivityMock.mock.calls.length, 1);
    });
  });
});