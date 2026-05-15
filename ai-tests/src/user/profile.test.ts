/**
 * @requirement REQ-PROF-01
 * @source docs/requirements/sub-requirements/REQ-PROF-01.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateProfileUpdate } from '../../../src/user/profile';

describe('validateProfileUpdate', () => {
  it('REQ-PROF-01.5: should return no errors for an empty payload (partial update)', () => {
    const errors = validateProfileUpdate({});
    assert.deepEqual(errors, {}, 'Empty payload should be valid');
  });

  it('REQ-PROF-01.5: should return no errors for a payload with only unvalidated fields', () => {
    const errors = validateProfileUpdate({ bio: 'New bio here' });
    assert.deepEqual(errors, {}, 'Payload with only unvalidated fields should be valid');
  });

  it('REQ-PROF-01.1: should return an error if name is provided and is less than 2 characters', () => {
    const errors = validateProfileUpdate({ name: 'a' });
    assert.deepEqual(errors, { name: 'Name must be at least 2 characters' });
  });

  it('REQ-PROF-01.1: should return an error if name is provided and is less than 2 characters after trimming', () => {
    const errors = validateProfileUpdate({ name: ' a ' });
    assert.deepEqual(errors, { name: 'Name must be at least 2 characters' });
  });

  it('REQ-PROF-01.1: should return no error if name is exactly 2 characters', () => {
    const errors = validateProfileUpdate({ name: 'ab' });
    assert.deepEqual(errors, {}, 'Name with 2 characters should be valid');
  });

  it('REQ-PROF-01.2: should return an error if email is provided and is not a valid format', () => {
    const errors = validateProfileUpdate({ email: 'invalid-email' });
    assert.deepEqual(errors, { email: 'Please enter a valid email address' });
  });

  it('REQ-PROF-01.3: should return an error if email is provided but currentPassword is not', () => {
    const errors = validateProfileUpdate({ email: 'new@example.com' });
    assert.deepEqual(errors, { currentPassword: 'Current password is required to change email' });
  });

  it('REQ-PROF-01.3: should not check for currentPassword if email format is invalid', () => {
    // The implementation uses an else-if, so the password check is skipped if the email format is invalid.
    const errors = validateProfileUpdate({ email: 'invalid-email' });
    assert.deepEqual(errors, { email: 'Please enter a valid email address' });
  });

  it('should return no errors if a valid email and currentPassword are provided', () => {
    const errors = validateProfileUpdate({
      email: 'new@example.com',
      currentPassword: 'password123',
    });
    assert.deepEqual(errors, {}, 'Valid email change with password should be valid');
  });

  it('should return multiple errors if multiple fields are invalid', () => {
    const errors = validateProfileUpdate({
      name: 'a',
      email: 'invalid-email',
    });
    assert.deepEqual(errors, {
      name: 'Name must be at least 2 characters',
      email: 'Please enter a valid email address',
    });
  });

  it('REQ-PROF-01.4: should not validate or require currentPassword if email is not in the payload', () => {
    const errors = validateProfileUpdate({ name: 'A valid name' });
    assert.deepEqual(errors, {}, 'Should not validate password if email is not being updated');
  });
});