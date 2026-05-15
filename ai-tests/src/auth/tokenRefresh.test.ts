/**
 * @requirement REQ-AUTH-04
 * @source docs/requirements/sub-requirements/REQ-AUTH-04.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../../../src/utils/api';
import * as session from '../../../src/auth/session';
import { needsRefresh, refreshToken, ensureFreshToken } from '../../../src/auth/tokenRefresh';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

describe('Proactive Token Refresh', () => {
  let getSessionMock: any;
  let setSessionMock: any;
  let handleExpiredSessionMock: any;
  let isSessionExpiredMock: any;
  let apiClientMock: any;
  let dateNowMock: any;
  let setTimeoutMock: any;

  beforeEach(() => {
    const now = 1672531200000; // 2023-01-01 00:00:00 UTC
    dateNowMock = mock.method(Date, 'now', () => now);
    setTimeoutMock = mock.method(global, 'setTimeout', (cb: Function) => cb());

    getSessionMock = mock.method(session, 'getSession');
    setSessionMock = mock.method(session, 'setSession', () => {});
    handleExpiredSessionMock = mock.method(session, 'handleExpiredSession', () => {});
    isSessionExpiredMock = mock.method(session, 'isSessionExpired');
    apiClientMock = mock.method(api.apiClient, 'post');
  });

  afterEach(() => {
    mock.reset();
  });

  describe('needsRefresh', () => {
    it('REQ-AUTH-04: should return true when token expires in less than 5 minutes', () => {
      getSessionMock.mock.mockImplementation(() => ({
        token: 'token',
        expiresAt: Date.now() + FIVE_MINUTES_MS - 1000,
      }));
      assert.ok(needsRefresh());
    });

    it('REQ-AUTH-04: should return false when token expires in more than 5 minutes', () => {
      getSessionMock.mock.mockImplementation(() => ({
        token: 'token',
        expiresAt: Date.now() + FIVE_MINUTES_MS + 1000,
      }));
      assert.equal(needsRefresh(), false);
    });

    it('REQ-AUTH-04: should return false when session is already expired', () => {
      getSessionMock.mock.mockImplementation(() => ({
        token: 'token',
        expiresAt: Date.now() - 1000,
      }));
      assert.equal(needsRefresh(), false);
    });

    it('should return false when there is no session', () => {
      getSessionMock.mock.mockImplementation(() => null);
      assert.equal(needsRefresh(), false);
    });
  });

  describe('refreshToken', () => {
    it('REQ-AUTH-04: should make one API call and update session on success', async () => {
      const newSession = { token: 'new-token', expiresAt: Date.now() + 3600 * 1000 };
      getSessionMock.mock.mockImplementation(() => ({ token: 'old-token', expiresAt: Date.now() + 1000 }));
      apiClientMock.mock.mockImplementation(async () => newSession);

      const success = await refreshToken();

      assert.ok(success);
      assert.equal(apiClientMock.mock.callCount(), 1);
      assert.equal(setSessionMock.mock.callCount(), 1);
      assert.deepEqual(setSessionMock.mock.calls[0].arguments[0], newSession);
    });

    it('REQ-AUTH-04: should retry with exponential backoff on failure', async () => {
      getSessionMock.mock.mockImplementation(() => ({ token: 'old-token', expiresAt: Date.now() + 1000 }));
      const newSession = { token: 'new-token', expiresAt: Date.now() + 3600 * 1000 };

      apiClientMock.mock.mockImplementationOnce(async () => { throw new Error('Fail 1'); });
      apiClientMock.mock.mockImplementationOnce(async () => { throw new Error('Fail 2'); });
      apiClientMock.mock.mockImplementationOnce(async () => newSession);

      const delays: number[] = [];
      setTimeoutMock.mock.mockImplementation((cb: Function, delay: number) => {
        delays.push(delay);
        cb();
      });

      const success = await refreshToken();

      assert.ok(success);
      assert.equal(apiClientMock.mock.callCount(), 3);
      assert.deepEqual(delays, [1000, 2000]); // 1s, 2s backoff
      assert.equal(setSessionMock.mock.callCount(), 1);
    });

    it('REQ-AUTH-04: should clear session and redirect if all 3 attempts fail', async () => {
      getSessionMock.mock.mockImplementation(() => ({ token: 'old-token', expiresAt: Date.now() + 1000 }));
      apiClientMock.mock.mockImplementation(async () => { throw new Error('API failed'); });

      const success = await refreshToken();

      assert.equal(success, false);
      assert.equal(apiClientMock.mock.callCount(), 3);
      assert.equal(setSessionMock.mock.callCount(), 0);
      assert.equal(handleExpiredSessionMock.mock.callCount(), 1);
    });

    it('REQ-AUTH-04: should only make one API call for simultaneous requests', async () => {
      getSessionMock.mock.mockImplementation(() => ({ token: 'old-token', expiresAt: Date.now() + 1000 }));
      const newSession = { token: 'new-token', expiresAt: Date.now() + 3600 * 1000 };
      apiClientMock.mock.mockImplementation(async () => newSession);

      const [res1, res2] = await Promise.all([refreshToken(), refreshToken()]);

      assert.ok(res1);
      assert.ok(res2);
      assert.equal(apiClientMock.mock.callCount(), 1);
      assert.equal(setSessionMock.mock.callCount(), 1);
    });
  });

  describe('ensureFreshToken', () => {
    it('should handle expired session if session is already expired', async () => {
      isSessionExpiredMock.mock.mockImplementation(() => true);
      const result = await ensureFreshToken();
      assert.equal(result, false);
      assert.equal(handleExpiredSessionMock.mock.callCount(), 1);
    });

    it('should return true if token does not need refresh', async () => {
      isSessionExpiredMock.mock.mockImplementation(() => false);
      getSessionMock.mock.mockImplementation(() => ({
        token: 'token',
        expiresAt: Date.now() + FIVE_MINUTES_MS + 1000,
      }));
      const result = await ensureFreshToken();
      assert.ok(result);
      assert.equal(apiClientMock.mock.callCount(), 0);
    });

    it('should call refreshToken if token needs refresh', async () => {
      isSessionExpiredMock.mock.mockImplementation(() => false);
      getSessionMock.mock.mockImplementation(() => ({
        token: 'token',
        expiresAt: Date.now() + FIVE_MINUTES_MS - 1000,
      }));
      apiClientMock.mock.mockImplementation(async () => ({ token: 'new', expiresAt: Date.now() + 3600000 }));

      const result = await ensureFreshToken();

      assert.ok(result);
      assert.equal(apiClientMock.mock.callCount(), 1);
    });
  });
});