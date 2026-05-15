/**
 * @requirement REQ-PROF-03
 * @source docs/requirements/sub-requirements/REQ-PROF-03.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePreferences,
  mergePreferences,
  DEFAULT_PREFERENCES,
  type UserPreferences,
} from '../../../src/user/preferences';

describe('validatePreferences', () => {
  it('REQ-PROF-03: should return no errors for a valid partial payload', () => {
    const updates = { theme: 'dark' as const };
    const errors = validatePreferences(updates);
    assert.deepEqual(errors, {}, 'A valid partial update should produce no errors');
  });

  it('REQ-PROF-03: should return an error for an invalid theme', () => {
    const updates = { theme: 'ocean' as any };
    const errors = validatePreferences(updates);
    assert.equal(errors.theme, 'Theme must be one of: light, dark, system', 'Should report invalid theme');
  });

  it('REQ-PROF-03: should return an error for an invalid language', () => {
    const updates = { language: 'jp' as any };
    const errors = validatePreferences(updates);
    assert.equal(errors.language, 'Language must be one of: en, fr, es, de, sw', 'Should report invalid language');
  });

  it('REQ-PROF-03: should return an error for an invalid notification digest frequency', () => {
    const updates = { notifications: { digest: 'hourly' as any, push: true, email: true } };
    const errors = validatePreferences(updates);
    assert.equal(errors.notifications, 'Digest frequency must be one of: daily, weekly, never', 'Should report invalid digest frequency');
  });

  it('REQ-PROF-03: should return an error if push notifications are disabled but digest is not "never"', () => {
    const updates = { notifications: { push: false, digest: 'daily' as const, email: true } };
    const errors = validatePreferences(updates);
    assert.equal(errors.notifications, "Digest frequency must be 'never' when push notifications are disabled", 'Should enforce cross-field rule for notifications');
  });

  it('REQ-PROF-03: should allow setting digest to "never" when push notifications are disabled', () => {
    const updates = { notifications: { push: false, digest: 'never' as const, email: true } };
    const errors = validatePreferences(updates);
    assert.deepEqual(errors, {}, 'Should allow digest: "never" when push is false');
  });

  it('REQ-PROF-03: should validate multiple fields at once', () => {
    const updates = { theme: 'invalid' as any, language: 'invalid' as any };
    const errors = validatePreferences(updates);
    assert.ok(errors.theme, 'Should have a theme error');
    assert.ok(errors.language, 'Should have a language error');
  });
});

describe('mergePreferences', () => {
  const currentPrefs: UserPreferences = {
    ...DEFAULT_PREFERENCES,
    theme: 'light',
    language: 'fr',
    notifications: {
      email: true,
      push: true,
      digest: 'daily',
    },
    compactView: false,
  };

  it('REQ-PROF-03: should merge a top-level property without affecting others', () => {
    const updates = { theme: 'dark' as const };
    const merged = mergePreferences(currentPrefs, updates);
    assert.equal(merged.theme, 'dark');
    assert.equal(merged.language, 'fr');
    assert.equal(merged.compactView, false);
    assert.deepEqual(merged.notifications, currentPrefs.notifications);
  });

  it('REQ-PROF-03: should merge nested notification properties without replacing the whole object', () => {
    const updates = { notifications: { push: false } };
    const merged = mergePreferences(currentPrefs, updates);
    assert.equal(merged.notifications.push, false, 'Push notification setting should be updated');
    assert.equal(merged.notifications.email, true, 'Email notification setting should be preserved');
    assert.equal(merged.notifications.digest, 'daily', 'Digest setting should be preserved');
  });

  it('REQ-PROF-03: should handle updates to multiple notification sub-fields', () => {
    const updates = { notifications: { push: false, digest: 'never' as const } };
    const merged = mergePreferences(currentPrefs, updates);
    assert.equal(merged.notifications.push, false);
    assert.equal(merged.notifications.digest, 'never');
    assert.equal(merged.notifications.email, true);
  });

  it('REQ-PROF-03: should return the original object if updates are empty', () => {
    const updates = {};
    const merged = mergePreferences(currentPrefs, updates);
    assert.deepEqual(merged, currentPrefs);
  });

  it('REQ-PROF-03: should correctly merge when notifications are undefined in the update', () => {
    const updates = { theme: 'system' as const };
    const merged = mergePreferences(currentPrefs, updates);
    assert.equal(merged.theme, 'system');
    assert.deepEqual(merged.notifications, currentPrefs.notifications, 'Notifications object should remain unchanged');
  });
});