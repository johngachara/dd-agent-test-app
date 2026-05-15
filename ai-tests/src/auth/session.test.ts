/**
 * @requirement REQ-AUTH-02
 * @source docs/requirements/sub-requirements/REQ-AUTH-02.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  isSessionExpired,
  handleExpiredSession,
  clearSession,
  checkSessionOnNavigation,
  refreshActivity,
} from '../../../src/auth/session';

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

describe('Session Expiry', () => {
  let mockStorage: Record<string, string>;
  const realLocalStorage = global.localStorage;
  const realWindowLocation = global.window?.location;
  let dateNowMock: any;

  beforeEach(() => {
    // Mock Date.now()
    const now = 1672531200000; // A fixed point in time: 2023-01-01 00:00:00 UTC
    dateNowMock = mock.method(Date, 'now', () => now);

    // Mock localStorage
    mockStorage = {};
    const mockLocalStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => (mockStorage[key] = value),
      removeItem: (key: string) => delete mockStorage[key],
      clear: () => (mockStorage = {}),
    };
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock window.location
    if (global.window) {
      Object.defineProperty(global.window, 'location', {
        value: { href: '', pathname: '/dashboard', search: '?filter=active' },
        writable: true,
      });
    } else {
      (global as any).window = { location: { href: '', pathname: '/dashboard', search: '?filter=active' } };
    }
  });

  afterEach(() => {
    dateNowMock.mock.restore();
    Object.defineProperty(global, 'localStorage', {
      value: realLocalStorage,
      writable: true,
    });
    if (global.window) {
      global.window.location = realWindowLocation;
    }
  });

  it('REQ-AUTH-02: isSessionExpired should return true if session has been inactive for 30 minutes', () => {
    localStorage.setItem('session_token', 'token');
    localStorage.setItem('session_expires_at', String(Date.now() + THIRTY_MINUTES_MS * 2));
    localStorage.setItem('session_last_active', String(Date.now() - THIRTY_MINUTES_MS));
    assert.ok(isSessionExpired());
  });

  it('REQ-AUTH-02: isSessionExpired should return true if server-issued token expiry time is reached', () => {
    localStorage.setItem('session_token', 'token');
    localStorage.setItem('session_expires_at', String(Date.now() - 1));
    localStorage.setItem('session_last_active', String(Date.now()));
    assert.ok(isSessionExpired());
  });

  it('REQ-AUTH-02: isSessionExpired should return false for an active and valid session', () => {
    localStorage.setItem('session_token', 'token');
    localStorage.setItem('session_expires_at', String(Date.now() + 10000));
    localStorage.setItem('session_last_active', String(Date.now() - 1000));
    assert.equal(isSessionExpired(), false);
  });

  it('REQ-AUTH-02: refreshActivity should update the session_last_active timestamp', () => {
    const initialTime = Date.now() - 5000;
    localStorage.setItem('session_token', 'token');
    localStorage.setItem('session_expires_at', String(Date.now() + 10000));
    localStorage.setItem('session_last_active', String(initialTime));

    refreshActivity();

    const newTime = localStorage.getItem('session_last_active');
    assert.equal(newTime, String(Date.now()));
  });

  it('REQ-AUTH-02: handleExpiredSession should clear all local session data', () => {
    localStorage.setItem('session_token', 'token');
    localStorage.setItem('session_expires_at', '123');
    localStorage.setItem('session_last_active', '456');

    handleExpiredSession();

    assert.equal(localStorage.getItem('session_token'), null);
    assert.equal(localStorage.getItem('session_expires_at'), null);
    assert.equal(localStorage.getItem('session_last_active'), null);
  });

  it('REQ-AUTH-02: handleExpiredSession should redirect to /login with a redirect parameter', () => {
    handleExpiredSession();
    const expectedPath = '/dashboard?filter=active';
    const expectedRedirect = `/login?redirect=${encodeURIComponent(expectedPath)}`;
    assert.equal(global.window.location.href, expectedRedirect);
  });

  it('REQ-AUTH-02: checkSessionOnNavigation should handle expired session', () => {
    localStorage.setItem('session_token', 'token');
    localStorage.setItem('session_expires_at', String(Date.now() - 1)); // Expired
    localStorage.setItem('session_last_active', String(Date.now()));

    checkSessionOnNavigation();

    assert.equal(localStorage.getItem('session_token'), null, 'Session data should be cleared');
    assert.ok(global.window.location.href.startsWith('/login?redirect='));
  });

  it('REQ-AUTH-02: checkSessionOnNavigation should refresh activity for a valid session', () => {
    const initialTime = Date.now() - 5000;
    localStorage.setItem('session_token', 'token');
    localStorage.setItem('session_expires_at', String(Date.now() + 10000));
    localStorage.setItem('session_last_active', String(initialTime));

    checkSessionOnNavigation();

    const newTime = localStorage.getItem('session_last_active');
    assert.equal(newTime, String(Date.now()));
    assert.equal(global.window.location.href, '', 'Should not redirect');
  });

  it('REQ-AUTH-02: clearSession should remove all session-related keys from localStorage', () => {
    localStorage.setItem('session_token', 'token');
    localStorage.setItem('session_expires_at', '123');
    localStorage.setItem('session_last_active', '456');
    localStorage.setItem('other_data', 'should_remain');

    clearSession();

    assert.equal(localStorage.getItem('session_token'), null);
    assert.equal(localStorage.getItem('session_expires_at'), null);
    assert.equal(localStorage.getItem('session_last_active'), null);
    assert.equal(localStorage.getItem('other_data'), 'should_remain');
  });
});