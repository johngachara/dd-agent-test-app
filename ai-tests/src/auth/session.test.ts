/**
 * @requirement REQ-AUTH-02
 * @source docs/requirements/sub-requirements/REQ-AUTH-02.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  setSession,
  getSession,
  isSessionExpired,
  refreshActivity,
  clearSession,
} from '../../../src/auth/session';

const SESSION_INACTIVITY_MS = 30 * 60 * 1000;

// Mock localStorage for Node.js environment
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  },
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  },
  removeItem(key: string): void {
    delete this.store[key];
  },
  clear(): void {
    this.store = {};
  },
};

// @ts-ignore-next-line
global.localStorage = mockLocalStorage;

describe('Session Management', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    mock.timers.reset();
  });

  describe('isSessionExpired', () => {
    it('should return true if no session token exists', () => {
      assert.ok(isSessionExpired());
    });

    it('should return true if session token exists but expiry is missing', () => {
      mockLocalStorage.setItem('session_token', 'test-token');
      assert.ok(isSessionExpired());
    });

    it('should return true if last active timestamp is missing', () => {
      const now = Date.now();
      setSession({ token: 'test-token', expiresAt: now + 10000 });
      mockLocalStorage.removeItem('session_last_active'); // Manually remove for test case
      assert.ok(isSessionExpired());
    });

    it('should return true if the server-issued token expiry time is in the past', () => {
      mock.timers.enable({ now: 1700000000000 });
      const now = Date.now();
      setSession({ token: 'test-token', expiresAt: now - 1 });
      assert.ok(isSessionExpired());
      mock.timers.reset();
    });

    it('should return true if inactivity duration exceeds 30 minutes', () => {
      mock.timers.enable({ now: 1700000000000 });
      const now = Date.now();
      setSession({ token: 'test-token', expiresAt: now + SESSION_INACTIVITY_MS * 2 });

      // Simulate inactivity
      mock.timers.tick(SESSION_INACTIVITY_MS);

      assert.ok(isSessionExpired());
      mock.timers.reset();
    });

    it('should return false for an active session within both expiry and inactivity limits', () => {
      mock.timers.enable({ now: 1700000000000 });
      const now = Date.now();
      setSession({ token: 'test-token', expiresAt: now + SESSION_INACTIVITY_MS * 2 });

      // Simulate some activity time, but less than the limit
      mock.timers.tick(SESSION_INACTIVITY_MS - 1);

      assert.equal(isSessionExpired(), false);
      mock.timers.reset();
    });
  });

  describe('refreshActivity', () => {
    it('should update the last active timestamp to the current time', () => {
      mock.timers.enable({ now: 1700000000000 });
      const startTime = Date.now();
      setSession({ token: 'test-token', expiresAt: startTime + 100000 });
      assert.equal(mockLocalStorage.getItem('session_last_active'), String(startTime));

      const refreshTime = startTime + 5000;
      mock.timers.tick(5000);

      refreshActivity();

      assert.equal(mockLocalStorage.getItem('session_last_active'), String(refreshTime));
      mock.timers.reset();
    });

    it('should not update activity timestamp if session is already expired', () => {
      mock.timers.enable({ now: 1700000000000 });
      const startTime = Date.now();
      setSession({ token: 'test-token', expiresAt: startTime - 1 }); // Expired session
      assert.equal(mockLocalStorage.getItem('session_last_active'), String(startTime));

      mock.timers.tick(5000);
      refreshActivity();

      // Timestamp should not have been updated
      assert.equal(mockLocalStorage.getItem('session_last_active'), String(startTime));
      mock.timers.reset();
    });
  });

  describe('clearSession', () => {
    it('should remove all session-related data from localStorage', () => {
      setSession({ token: 'test-token', expiresAt: Date.now() + 10000 });
      assert.ok(mockLocalStorage.getItem('session_token'));
      assert.ok(mockLocalStorage.getItem('session_expires_at'));
      assert.ok(mockLocalStorage.getItem('session_last_active'));

      clearSession();

      assert.equal(mockLocalStorage.getItem('session_token'), null);
      assert.equal(mockLocalStorage.getItem('session_expires_at'), null);
      assert.equal(mockLocalStorage.getItem('session_last_active'), null);
    });
  });

  describe('getSession', () => {
    it('should return null if token is missing', () => {
      mockLocalStorage.setItem('session_expires_at', String(Date.now() + 1000));
      assert.equal(getSession(), null);
    });

    it('should return null if expiresAt is missing', () => {
      mockLocalStorage.setItem('session_token', 'test-token');
      assert.equal(getSession(), null);
    });

    it('should return the session object with a parsed expiresAt number', () => {
      const expiresAt = Date.now() + 10000;
      mockLocalStorage.setItem('session_token', 'test-token');
      mockLocalStorage.setItem('session_expires_at', String(expiresAt));

      const session = getSession();
      assert.deepEqual(session, {
        token: 'test-token',
        expiresAt: expiresAt,
      });
      assert.equal(typeof session?.expiresAt, 'number');
    });
  });
});