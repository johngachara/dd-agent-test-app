/**
 * @requirement REQ-AUTH-03
 * @source docs/requirements/sub-requirements/REQ-AUTH-03.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as api from "../../../src/utils/api";
import * as session from "../../../src/auth/session";
import { logout, cancelAllPendingRequests, registerPendingRequest } from "../../../src/auth/logout";

// Mock AbortController
class MockAbortController {
  signal = {};
  aborted = false;
  abort() {
    this.aborted = true;
  }
}

describe("logout", () => {
  let locationMock: { href: string };

  beforeEach(() => {
    // Mock window.location
    locationMock = { href: "" };
    Object.defineProperty(global, "window", {
      value: { location: locationMock },
      writable: true,
    });
    // Reset pending requests before each test
    cancelAllPendingRequests();
  });

  afterEach(() => {
    mock.restoreAll();
    // @ts-ignore
    delete global.window;
  });

  it("REQ-AUTH-03.1: should cancel all pending requests immediately", async () => {
    const controller1 = new MockAbortController();
    const controller2 = new MockAbortController();
    registerPendingRequest(controller1 as any);
    registerPendingRequest(controller2 as any);

    mock.method(session, "getSession", () => ({ token: "test-token", expiresAt: Date.now() + 10000 }));
    mock.method(api.apiClient, "post", async () => ({}));
    mock.method(session, "clearSession", () => {});

    await logout();

    assert.ok(controller1.aborted, "First controller should be aborted");
    assert.ok(controller2.aborted, "Second controller should be aborted");
  });

  it("REQ-AUTH-03.2: should call the server logout endpoint with the current session token", async () => {
    const mockSession = { token: "test-token-123", expiresAt: Date.now() + 10000 };
    mock.method(session, "getSession", () => mockSession);
    const postMock = mock.method(api.apiClient, "post", async () => ({}));
    mock.method(session, "clearSession", () => {});

    await logout();

    assert.equal(postMock.mock.calls.length, 1, "apiClient.post should be called once");
    const [url, _body, options] = postMock.mock.calls[0].arguments;
    assert.equal(url, "/auth/logout");
    assert.deepEqual(options, { token: mockSession.token });
  });

  it("REQ-AUTH-03.3: should clear local session data even if the server call fails", async () => {
    mock.method(session, "getSession", () => ({ token: "test-token", expiresAt: Date.now() + 10000 }));
    mock.method(api.apiClient, "post", async () => {
      throw new Error("Network Error");
    });
    const clearSessionMock = mock.method(session, "clearSession", () => {});

    await logout();

    assert.equal(clearSessionMock.mock.calls.length, 1, "clearSession should be called despite the API error");
  });

  it("REQ-AUTH-03.4: should redirect to /login with no redirect parameter", async () => {
    mock.method(session, "getSession", () => null); // No session needed for this check
    mock.method(api.apiClient, "post", async () => ({}));
    mock.method(session, "clearSession", () => {});

    await logout();

    assert.equal(locationMock.href, "/login");
  });

  it("should not make a server call if no session token exists but still clear data and redirect", async () => {
    mock.method(session, "getSession", () => null);
    const postMock = mock.method(api.apiClient, "post", async () => ({}));
    const clearSessionMock = mock.method(session, "clearSession", () => {});

    await logout();

    assert.equal(postMock.mock.calls.length, 0, "apiClient.post should not be called");
    assert.equal(clearSessionMock.mock.calls.length, 1, "clearSession should still be called");
    assert.equal(locationMock.href, "/login", "Redirect should still happen");
  });
});