import test from 'node:test';
/**
 * @requirement REQ-PROF-03
 * @source docs/requirements/sub-requirements/REQ-PROF-03.md
 * @generated-by dd-agent app-mode 2026-05-16
 */

import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePreferences, mergePreferences, UserPreferences } from '../../../src/user/preferences';

describe('REQ-PROF-03 - User preferences validation', () => {
  describe('validatePreferences', () => {
    it('allows partial updates (empty payload)', () => {
      const errors = validatePreferences({});
      assert.deepEqual(errors, {});
    });

    it('allows valid partial updates', () => {
      const errors = validatePreferences({ theme: 'dark', language: 'fr' });
      assert.deepEqual(errors, {});
    });

    it('validates theme', () => {
      // @ts-expect-error testing invalid value
      const errors = validatePreferences({ theme: 'invalid-theme' });
      assert.equal(errors.theme, 'Theme must be one of: light, dark, system');
    });

    it('validates language', () => {
      // @ts-expect-error testing invalid value
      const errors = validatePreferences({ language: 'invalid-lang' });
      assert.equal(errors.language, 'Language must be one of: en, fr, es, de, sw');
    });

    it('validates digest frequency', () => {
      // @ts-expect-error testing invalid value
      const errors = validatePreferences({ notifications: { push: true, email: true, digest: 'hourly' } });
      assert.equal(errors.notifications, 'Digest frequency must be one of: daily, weekly, never');
    });

    it('enforces cross-field rule: push=false requires digest="never"', () => {
      const errors = validatePreferences({ 
        notifications: { push: false, email: true, digest: 'daily' } 
      });
      assert.equal(errors.notifications, "Digest frequency must be 'never' when push notifications are disabled");
    });

    it('allows push=false and digest="never"', () => {
      const errors = validatePreferences({ 
        notifications: { push: false, email: true, digest: 'never' } 
      });
      assert.deepEqual(errors, {});
    });
  });

  describe('mergePreferences', () => {
    it('merges top-level fields without replacing wholesale', () => {
      const current: UserPreferences = {
        theme: 'light',
        language: 'en',
        compactView: false,
        notifications: { email: true, push: true, digest: 'daily' }
      };

      const updates = { theme: 'dark' as const };
      const merged = mergePreferences(current, updates);

      assert.equal(merged.theme, 'dark');
      assert.equal(merged.language, 'en');
      assert.equal(merged.compactView, false);
      assert.deepEqual(merged.notifications, current.notifications);
    });

    it('merges notification sub-fields individually', () => {
      const current: UserPreferences = {
        theme: 'light',
        language: 'en',
        compactView: false,
        notifications: { email: true, push: true, digest: 'daily' }
      };

      // The requirement states: "setting push: false must not reset email to its default"
      // We simulate a partial update to notifications
      const updates = { 
        notifications: { push: false } as any 
      };
      
      const merged = mergePreferences(current, updates);

      assert.equal(merged.notifications.push, false);
      assert.equal(merged.notifications.digest, 'daily');
      assert.equal(merged.notifications.email, true);
    });
  });
});