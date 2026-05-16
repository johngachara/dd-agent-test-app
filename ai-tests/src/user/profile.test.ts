/**
 * @requirement REQ-PROF-01
 * @source docs/requirements/sub-requirements/REQ-PROF-01.md
 * @generated-by dd-agent app-mode 2026-05-16
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateProfileUpdate } from '../../../src/user/profile';

describe('REQ-PROF-01 - Profile update validation', () => {
  it('validates name length if provided', () => {
    // Name fewer than 2 characters
    const errors1 = validateProfileUpdate({ name: 'a' });
    assert.equal(errors1.name, 'Name must be at least 2 characters');

    // Name that is empty after trimming
    const errors2 = validateProfileUpdate({ name: '   ' });
    assert.equal(errors2.name, 'Name must be at least 2 characters');

    // Valid name
    const errors3 = validateProfileUpdate({ name: 'ab' });
    assert.equal(errors3.name, undefined);
  });

  it('validates email format if provided', () => {
    // Invalid email format (assuming the underlying validator catches missing @/domain)
    const errors = validateProfileUpdate({ email: 'invalid-email' });
    assert.equal(errors.email, 'Please enter a valid email address');
  });

  it('requires currentPassword if email is provided (changed)', () => {
    // Email provided but no currentPassword
    const errors1 = validateProfileUpdate({ email: 'valid@example.com' });
    assert.equal(errors1.currentPassword, 'Current password is required to change email');

    // Email provided but currentPassword is empty
    const errors2 = validateProfileUpdate({ email: 'valid@example.com', currentPassword: '' });
    assert.equal(errors2.currentPassword, 'Current password is required to change email');

    // Email provided and currentPassword provided
    const errors3 = validateProfileUpdate({ email: 'valid@example.com', currentPassword: 'password123' });
    assert.equal(errors3.currentPassword, undefined);
  });

  it('does not validate fields not included in the payload (partial updates)', () => {
    // Only bio is updated, email and name are omitted
    const errors = validateProfileUpdate({ bio: 'Just a bio update' });
    assert.deepEqual(errors, {});
    
    // Empty payload
    const emptyErrors = validateProfileUpdate({});
    assert.deepEqual(emptyErrors, {});
  });

  it('returns empty errors object for valid full payload', () => {
    const errors = validateProfileUpdate({
      name: 'Alice',
      email: 'alice@example.com',
      currentPassword: 'securepassword',
      bio: 'Hello world'
    });
    assert.deepEqual(errors, {});
  });
});