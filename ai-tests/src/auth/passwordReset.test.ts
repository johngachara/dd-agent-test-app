/**
 * @requirement REQ-AUTH-05
 * @source docs/requirements/sub-requirements/REQ-AUTH-05.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../../../src/utils/api';
import {
  isResetTokenExpired,
  validateResetToken,
  isPasswordReused,
  validateNewPassword,
  requestPasswordReset,
  resetPassword,
} from '../../../src/auth/passwordReset';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

describe('Password Reset Flow', () => {
  describe('Validate Stage: Token Validation', () => {
    it('REQ-AUTH-05: isResetTokenExpired should return true for a token older than 15 minutes', () => {
      const expiredToken = { value: 'token', issuedAt: Date.now() - FIFTEEN_MINUTES_MS };
      assert.ok(isResetTokenExpired(expiredToken));
    });

    it('REQ-AUTH-05: isResetTokenExpired should return false for a token newer than 15 minutes', () => {
      const validToken = { value: 'token', issuedAt: Date.now() - FIFTEEN_MINUTES_MS + 1000 };
      assert.equal(isResetTokenExpired(validToken), false);
    });

    it('REQ-AUTH-05: validateResetToken should return an error for an expired token', () => {
      const token = { value: 'longenoughtoken', issuedAt: Date.now() - FIFTEEN_MINUTES_MS };
      const result = validateResetToken(token);
      assert.deepEqual(result, {
        success: false,
        error: 'Reset token has expired. Please request a new one.',
      });
    });

    it('REQ-AUTH-05: validateResetToken should return an error for a token with fewer than 8 characters', () => {
      const token = { value: 'short', issuedAt: Date.now() };
      const result = validateResetToken(token);
      assert.deepEqual(result, { success: false, error: 'Invalid reset token' });
    });

    it('REQ-AUTH-05: validateResetToken should return success for a valid token', () => {
      const token = { value: 'valid-token-string', issuedAt: Date.now() };
      const result = validateResetToken(token);
      assert.deepEqual(result, { success: true });
    });
  });

  describe('Confirm Stage: New Password Validation', () => {
    const history = ['pass1', 'pass2', 'pass3', 'pass4', 'pass5'];

    it('REQ-AUTH-05: isPasswordReused should return true if password is one of the last 5', () => {
      assert.ok(isPasswordReused('pass5', history));
      assert.ok(isPasswordReused('pass1', history));
    });

    it('REQ-AUTH-05: isPasswordReused should return false if password is not in the last 5', () => {
      assert.equal(isPasswordReused('new-password', history), false);
      const longHistory = ['oldest', ...history];
      assert.equal(isPasswordReused('oldest', longHistory), false);
    });

    it('REQ-AUTH-05: validateNewPassword should return an error if password is less than 8 characters', () => {
      const result = validateNewPassword('short', 'short', history);
      assert.deepEqual(result, { success: false, error: 'Password must be at least 8 characters' });
    });

    it('REQ-AUTH-05: validateNewPassword should return an error if passwords do not match', () => {
      const result = validateNewPassword('newpassword123', 'newpassword456', history);
      assert.deepEqual(result, { success: false, error: 'Passwords do not match' });
    });

    it('REQ-AUTH-05: validateNewPassword should return an error if password was recently used', () => {
      const result = validateNewPassword('pass5', 'pass5', history);
      assert.deepEqual(result, {
        success: false,
        error: 'Cannot reuse any of your last 5 passwords',
      });
    });

    it('REQ-AUTH-05: validateNewPassword should return success for a valid new password', () => {
      const result = validateNewPassword('brandnewpassword', 'brandnewpassword', history);
      assert.deepEqual(result, { success: true });
    });
  });

  describe('API Interactions', () => {
    let apiClientMock: any;

    beforeEach(() => {
      apiClientMock = mock.method(api.apiClient, 'post', async () => ({}));
    });

    afterEach(() => {
      apiClientMock.mock.reset();
    });

    it('REQ-AUTH-05: requestPasswordReset should return an error for an invalid email without making a network request', async () => {
      const result = await requestPasswordReset('invalid-email');
      assert.deepEqual(result, { success: false, error: 'Please enter a valid email address' });
      assert.equal(apiClientMock.mock.callCount(), 0);
    });

    it('REQ-AUTH-05: requestPasswordReset should make a network request for a valid email', async () => {
      const result = await requestPasswordReset('valid@email.com');
      assert.deepEqual(result, { success: true });
      assert.equal(apiClientMock.mock.callCount(), 1);
      assert.deepEqual(apiClientMock.mock.calls[0].arguments[0], '/auth/password-reset/request');
    });

    it('REQ-AUTH-05: resetPassword should run all validations before making an API call', async () => {
      const expiredToken = { value: 'longenoughtoken', issuedAt: Date.now() - FIFTEEN_MINUTES_MS };
      const result = await resetPassword(expiredToken, 'newpass', 'newpass', []);
      assert.ok(result.error?.includes('expired'));
      assert.equal(apiClientMock.mock.callCount(), 0);

      const validToken = { value: 'valid-token', issuedAt: Date.now() };
      const result2 = await resetPassword(validToken, 'short', 'short', []);
      assert.ok(result2.error?.includes('8 characters'));
      assert.equal(apiClientMock.mock.callCount(), 0);
    });

    it('REQ-AUTH-05: resetPassword should make an API call if all validations pass', async () => {
      const validToken = { value: 'valid-token-string', issuedAt: Date.now() };
      const newPassword = 'newValidPassword123';
      const result = await resetPassword(validToken, newPassword, newPassword, []);

      assert.deepEqual(result, { success: true });
      assert.equal(apiClientMock.mock.callCount(), 1);
      assert.deepEqual(apiClientMock.mock.calls[0].arguments, [
        '/auth/password-reset/confirm',
        { token: validToken.value, newPassword },
      ]);
    });
  });
});