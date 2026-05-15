/**
 * @requirement REQ-AUTH-04
 * @source docs/requirements/sub-requirements/REQ-AUTH-04.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { setTimeout } from "timers/promises";
import * as api from "../../../src/utils/api";
import * as session from "../../../src/auth/session";
import { needsRefresh, refreshToken } from "../../../src/auth/tokenRefresh";

describe("Proactive Token Refresh", () => {
  const fiveMinutesInMs = 5 * 60 * 1000;
  const now = Date.now();

  beforeEach(() => {
    // Reset any module-level state if necessary, e.g., the refreshPromise lock
    // This is tricky without module mocking, but we can test around it.
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe("REQ-AUTH-04: Refresh condition", () => {
    it('should be true when token has less than 5 minutes remaining', () => {
      const expiresAt = now + fiveMinutesInMs - 1000; // 4m59s remaining
      mock.method(session, "getSession", () => ({ token: "test-token", expiresAt }));
      mock.method(Date, "now", () => now);

      assert.ok(needsRefresh());
    });

    it('should be false when token has more than 5 minutes remaining', () => {
      const expiresAt = now + fiveMinutesInMs + 1000; // 5m1s remaining
      mock.method(session, "getSession", () => ({ token: "test-token", expiresAt }));
      mock.method(Date, "now", () => now);

      assert.equal(needsRefresh(), false);
    });

    it('should be false when the session is already expired', () => {
      const expiresAt = now - 1000; // Expired 1s ago
      mock.method(session, "getSession", () => ({ token: "test-token", expiresAt }));
      mock.method(Date, "now", () => now);

      assert.equal(needsRefresh(), false);
    });

    it('should be false when no session exists', () => {
      mock.method(session, "getSession", () => null);
      assert.equal(needsRefresh(), false);
    });
  });

  describe("REQ-AUTH-04: Refresh logic", () => {
    it("should make only one HTTP call for simultaneous requests", async () => {
      const expiresAt = now + 1000;
      mock.method(session, "getSession", () => ({ token: "test-token", expiresAt }));
      const postMock = mock.method(api.apiClient, "post", async () => {
        await setTimeout(50); // Simulate network latency
        return { token: "new-token", expiresAt: now + 3600000 };
      });
      mock.method(session, "setSession", () => {});

      const [result1, result2] = await Promise.all([refreshToken(), refreshToken()]);

      assert.ok(result1, "First call should succeed");
      assert.ok(result2, "Second call should succeed");
      assert.equal(postMock.mock.calls.length, 1, "API should only be called once");
    });

    it("should retry up to 3 times with exponential backoff on failure", async () => {
      const expiresAt = now + 1000;
      mock.method(session, "getSession", () => ({ token: "test-token", expiresAt }));
      const postMock = mock.method(api.apiClient, "post", () => Promise.reject(new Error("Network Error")));
      const handleExpiredMock = mock.method(session, "handleExpiredSession", () => {});

      // Mock setTimeout to track delays
      const setTimeoutMock = mock.fn(setTimeout, async (delay) => {
        return Promise.resolve();
      });

      const success = await refreshToken();

      assert.equal(success, false);
      assert.equal(postMock.mock.calls.length, 3, "API should be called 3 times");
      assert.equal(setTimeoutMock.mock.calls.length, 2, "setTimeout should be called twice for backoff");

      // Check backoff delays: 1s, 2s. The 3rd attempt doesn't wait after.
      assert.equal(setTimeoutMock.mock.calls[0].arguments[0], 1000); // 1s
      assert.equal(setTimeoutMock.mock.calls[1].arguments[0], 2000); // 2s
    });

    it("should clear session and redirect if all 3 attempts fail", async () => {
      const expiresAt = now + 1000;
      mock.method(session, "getSession", () => ({ token: "test-token", expiresAt }));
      mock.method(api.apiClient, "post", () => Promise.reject(new Error("Network Error")));
      const handleExpiredMock = mock.method(session, "handleExpiredSession", () => {});
      mock.fn(setTimeout, async () => {}); // Speed up test

      await refreshToken();

      assert.equal(handleExpiredMock.mock.calls.length, 1, "handleExpiredSession should be called after all retries fail");
    });

    it("should update the session with the new token on success", async () => {
      const expiresAt = now + 1000;
      const newSessionData = { token: "new-fresh-token", expiresAt: now + 3600000 };
      mock.method(session, "getSession", () => ({ token: "old-token", expiresAt }));
      mock.method(api.apiClient, "post", async () => newSessionData);
      const setSessionMock = mock.method(session, "setSession", () => {});

      const success = await refreshToken();

      assert.ok(success);
      assert.equal(setSessionMock.mock.calls.length, 1, "setSession should be called on success");
      assert.deepEqual(setSessionMock.mock.calls[0].arguments[0], newSessionData);
    });
  });
});