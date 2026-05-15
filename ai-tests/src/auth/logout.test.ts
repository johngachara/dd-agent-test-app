/**
 * @requirement REQ-AUTH-03
 * @source docs/requirements/sub-requirements/REQ-AUTH-03.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../../../src/utils/api';
import * as session from '../../../src/auth/session';
import { logout, registerPendingRequest, cancelAllPendingRequests } from '../../../src/auth/logout';

// Mock AbortController
class MockAbortController {
  signal = { aborted: false };
  abort = mock.fn(() => {
    this.signal.aborted = true;
  });
}

describe('Pending Request Cancellation', () => {
  it('REQ-AUTH-03: should cancel all registered pending requests', () => {
    const controller1 = new MockAbortController();
    const controller2 = new MockAbortController();

    registerPendingRequest(controller1 as any);
    registerPendingRequest(controller2 as any);

    cancelAllPendingRequests();

    assert.equal(controller1.abort.mock.callCount(), 1, 'Controller 1 should be aborted');
    assert.equal(controller2.abort.mock.callCount(), 1, 'Controller 2 should be aborted');

    // Verify the internal array is cleared
    cancelAllPendingRequests();
    assert.equal(controller1.abort.mock.callCount(), 1, 'Controller 1 should not be aborted again');
  });
});

describe('logout', () => {
  let apiClientMock: any;
  let getSessionMock: any;
  let clearSessionMock: any;
  const realWindowLocation = global.window?.location;

  beforeEach(() => {
    apiClientMock = mock.method(api.apiClient, 'post', async () => ({}));
    getSessionMock = mock.method(session, 'getSession');
    clearSessionMock = mock.method(session, 'clearSession', () => {});

    // Mock window.location
    if (global.window) {
      Object.defineProperty(global.window, 'location', {
        value: { href: '' },
        writable: true,
      });
    } else {
      (global as any).window = { location: { href: '' } };
    }
  });

  afterEach(() => {
    mock.reset();
    if (global.window) {
      global.window.location = realWindowLocation;
    }
  });

  it('REQ-AUTH-03: should cancel pending requests, call logout endpoint, clear session, and redirect', async () => {
    getSessionMock.mock.mockImplementation(() => ({ token: 'fake-token' }));
    const controller = new MockAbortController();
    registerPendingRequest(controller as any);

    await logout();

    assert.ok(controller.abort.mock.callCount() > 0, 'Pending requests should be cancelled');
    assert.equal(apiClientMock.mock.callCount(), 1, 'Logout endpoint should be called');
    assert.deepEqual(apiClientMock.mock.calls[0].arguments, ['/auth/logout', {}, { token: 'fake-token' }]);
    assert.equal(clearSessionMock.mock.callCount(), 1, 'Local session data should be cleared');
    assert.equal(global.window.location.href, '/login', 'User should be redirected to /login');
  });

  it('REQ-AUTH-03: should clear session and redirect even if the server call fails', async () => {
    getSessionMock.mock.mockImplementation(() => ({ token: 'fake-token' }));
    apiClientMock.mock.mockImplementation(async () => {
      throw new Error('Network error');
    });

    await logout();

    assert.equal(apiClientMock.mock.callCount(), 1, 'Logout endpoint should be attempted');
    assert.equal(clearSessionMock.mock.callCount(), 1, 'Local session data must still be cleared on failure');
    assert.equal(global.window.location.href, '/login', 'User must still be redirected on failure');
  });

  it('REQ-AUTH-03: should not call the logout endpoint if no session token exists', async () => {
    getSessionMock.mock.mockImplementation(() => null);

    await logout();

    assert.equal(apiClientMock.mock.callCount(), 0, 'Logout endpoint should not be called without a token');
    assert.equal(clearSessionMock.mock.callCount(), 1, 'Local session data should still be cleared');
    assert.equal(global.window.location.href, '/login', 'User should still be redirected');
  });

  it('REQ-AUTH-03: should redirect to /login without a ?redirect= parameter', async () => {
    getSessionMock.mock.mockImplementation(() => ({ token: 'fake-token' }));
    await logout();
    assert.equal(global.window.location.href, '/login');
  });
});