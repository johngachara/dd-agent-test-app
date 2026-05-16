import test from 'node:test';
/**
 * @requirement REQ-PROF-03
 * @source docs/requirements/sub-requirements/REQ-PROF-03.md
 * @generated-by dd-agent app-mode 2026-05-16
 */

import test, { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePreferences,
  mergePreferences,
  savePreferences,
  UserPreferences
} from '../../../src/user/preferences';
import { apiClient } from '../../../src/utils/api';

describe('User Preferences (REQ-PROF-03)', () => {
  describe('validatePreferences', () => {
    it('allows valid partial updates', () => {
      const errors = validatePreferences({ theme: 'dark' });
      assert.deepEqual(errors, {});
    });

    it('validates theme', () => {
      const errors = validatePreferences({ theme: 'neon' as any });
      assert.ok(errors.theme?.includes('Theme must be one of:'));
    });

    it('validates language', () => {
      const errors = validatePreferences({ language: 'it' as any });
      assert.ok(errors.language?.includes('Language must be one of:'));
      
      const validErrors = validatePreferences({ language: 'fr' });
      assert.deepEqual(validErrors, {});
    });

    it('validates digest frequency', () => {
      const errors = validatePreferences({
        notifications: { email: true, push: true, digest: 'hourly' as any }
      });
      assert.ok(errors.notifications?.includes('Digest frequency must be one of:'));
    });

    it('enforces cross-field rule: push disabled requires digest never', () => {
      const errors = validatePreferences({
        notifications: { email: true, push: false, digest: 'daily' }
      });
      assert.equal(
        errors.notifications,
        "Digest frequency must be 'never' when push notifications are disabled"
      );
    });

    it('allows push disabled with digest never', () => {
      const errors = validatePreferences({
        notifications: { email: true, push: false, digest: 'never' }
      });
      assert.deepEqual(errors, {});
    });
  });

  describe('mergePreferences', () => {
    it('merges top-level fields without replacing wholesale', () => {
      const current: UserPreferences = {
        theme: 'light',
        language: 'en',
        notifications: { email: true, push: true, digest: 'daily' },
        compactView: false
      };
      
      const updated = mergePreferences(current, { theme: 'dark' });
      assert.equal(updated.theme, 'dark');
      assert.equal(updated.language, 'en');
      assert.deepEqual(updated.notifications, current.notifications);
      assert.equal(updated.compactView, false);
    });

    it('merges notifications sub-fields individually', () => {
      const current: UserPreferences = {
        theme: 'light',
        language: 'en',
        notifications: { email: true, push: true, digest: 'daily' },
        compactView: false
      };
      
      // Cast to any to simulate partial notification update as allowed by the merge logic
      const updated = mergePreferences(current, {
        notifications: { push: false, digest: 'never' } as any
      });
      
      assert.equal(updated.notifications.push, false);
      assert.equal(updated.notifications.digest, 'never');
      assert.equal(updated.notifications.email, true, 'email setting should be preserved');
    });
  });

  describe('savePreferences', () => {
    beforeEach(() => {
      const mockStorage = {
        getItem: mock.fn((key: string) => {
          if (key === 'session_token') return 'valid-token';
          if (key === 'session_expires_at') return (Date.now() + 10000).toString();
          return null;
        }),
        setItem: mock.fn(),
        removeItem: mock.fn()
      };

      (global as any).localStorage = mockStorage;
      Object.defineProperty(global, 'window', {
        value: { localStorage: mockStorage },
        writable: true,
        configurable: true
      });
    });

    afterEach(() => {
      delete (global as any).localStorage;
      delete (global as any).window;
      mock.restoreAll();
    });

    it('throws if not authenticated', async () => {
      (global as any).localStorage.getItem = () => null;
      await assert.rejects(
        savePreferences('user-1', { theme: 'dark' }),
        /Not authenticated/
      );
    });

    it('throws if validation fails', async () => {
      await assert.rejects(
        savePreferences('user-1', { theme: 'invalid' as any }),
        /Theme must be one of/
      );
    });

    it('calls apiClient.patch with updates and token on success', async () => {
      mock.method(apiClient, 'patch', async () => ({ theme: 'dark' }));
      
      const result = await savePreferences('user-1', { theme: 'dark' });
      
      assert.equal(result.theme, 'dark');
      const patchMock = (apiClient.patch as any).mock;
      assert.equal(patchMock.callCount(), 1);
      
      const call = patchMock.calls[0];
      assert.equal(call.arguments[0], '/users/user-1/preferences');
      assert.deepEqual(call.arguments[1], { theme: 'dark' });
      assert.deepEqual(call.arguments[2], { token: 'valid-token' });
    });
  });
});