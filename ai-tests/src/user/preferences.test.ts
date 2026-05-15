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
  it('should return no errors for a valid partial payload', () => {
    const errors = validatePreferences({ theme: 'dark' });
    assert.deepEqual(errors, {});
  });

  it('should return an error for an invalid theme', () => {
    const errors = validatePreferences({ theme: 'ocean' as any });
    assert.equal(errors.theme, 'Theme must be one of: light, dark, system');
  });

  it('should return an error for an invalid language', () => {
    const errors = validatePreferences({ language: 'jp' as any });
    assert.equal(errors.language, 'Language must be one of: en, fr, es, de, sw');
  });

  it('should return an error for an invalid notification digest frequency', () => {
    const errors = validatePreferences({ notifications: { digest: 'hourly' } as any });
    assert.equal(errors.notifications, "Digest frequency must be one of: daily, weekly, never");
  });

  it('should return an error if push notifications are disabled but digest is not "never"', () => {
    const errors = validatePreferences({
      notifications: { push: false, digest: 'daily' },
    } as any);
    assert.equal(
      errors.notifications,
      "Digest frequency must be 'never' when push notifications are disabled"
    );
  });

  it('should not return an error if push notifications are disabled and digest is "never"', () => {
    const errors = validatePreferences({
      notifications: { push: false, digest: 'never' },
    } as any);
    assert.deepEqual(errors, {});
  });

  it('should return no errors for an empty payload', () => {
    const errors = validatePreferences({});
    assert.deepEqual(errors, {});
  });
});

describe('mergePreferences', () => {
  const currentPrefs: UserPreferences = {
    theme: 'dark',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      digest: 'daily',
    },
    compactView: false,
  };

  it('should merge top-level properties', () => {
    const updates = { language: 'fr' as const, compactView: true };
    const merged = mergePreferences(currentPrefs, updates);
    assert.equal(merged.language, 'fr');
    assert.equal(merged.compactView, true);
    assert.equal(merged.theme, 'dark'); // Unchanged
  });

  it('should merge nested notification properties without replacing the whole object', () => {
    const updates = { notifications: { push: false } };
    const merged = mergePreferences(currentPrefs, updates);

    assert.equal(merged.notifications.push, false);
    assert.equal(merged.notifications.email, true); // Should remain from original
    assert.equal(merged.notifications.digest, 'daily'); // Should remain from original
  });

  it('should handle updates to both top-level and nested properties', () => {
    const updates = {
      theme: 'light' as const,
      notifications: { digest: 'weekly' as const },
    };
    const merged = mergePreferences(currentPrefs, updates);

    assert.equal(merged.theme, 'light');
    assert.equal(merged.notifications.digest, 'weekly');
    assert.equal(merged.notifications.push, true); // Unchanged
  });

  it('should not alter notifications if they are not in the update payload', () => {
    const updates = { theme: 'system' as const };
    const merged = mergePreferences(currentPrefs, updates);
    assert.deepEqual(merged.notifications, currentPrefs.notifications);
  });

  it('should return a deep copy of the original preferences if updates are empty', () => {
    const updates = {};
    const merged = mergePreferences(currentPrefs, updates);
    assert.deepEqual(merged, currentPrefs);
    assert.notEqual(merged, currentPrefs); // Ensure it's a new object
  });
});