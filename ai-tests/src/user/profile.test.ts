/**
 * @requirement REQ-PROF-01
 * @source docs/requirements/sub-requirements/REQ-PROF-01.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateProfileUpdate } from '../../../src/user/profile';

describe('validateProfileUpdate', () => {
  it('REQ-PROF-01: should return no errors for a valid payload', () => {
    const payload = { name: 'John Doe', bio: 'A new bio.' };
    const errors = validateProfileUpdate(payload);
    assert.deepEqual(errors, {}, 'A valid payload should result in no errors');
  });

  it('REQ-PROF-01: should return an error if name is provided and is less than 2 characters', () => {
    const payload = { name: 'A' };
    const errors = validateProfileUpdate(payload);
    assert.equal(errors.name, 'Name must be at least 2 characters');
  });

  it('REQ-PROF-01: should return an error if name is provided and is less than 2 characters after trimming', () => {
    const payload = { name: ' B ' };
    const errors = validateProfileUpdate(payload);
    assert.equal(errors.name, 'Name must be at least 2 characters');
  });

  it('REQ-PROF-01: should not return a name error if name is not provided', () => {
    const payload = { bio: 'Just updating my bio.' };
    const errors = validateProfileUpdate(payload);
    assert.equal(errors.name, undefined, 'Partial updates without a name should be allowed');
  });

  it('REQ-PROF-01: should return an error if email is provided and is invalid', () => {
    const payload = { email: 'not-an-email' };
    const errors = validateProfileUpdate(payload);
    assert.equal(errors.email, 'Please enter a valid email address');
  });

  it('REQ-PROF-01: should return an error if email is provided but currentPassword is not', () => {
    const payload = { email: 'new.email@example.com' };
    const errors = validateProfileUpdate(payload);
    assert.equal(errors.currentPassword, 'Current password is required to change email');
  });

  it('REQ-PROF-01: should not return a password error if email is not provided', () => {
    const payload = { name: 'Just a name update' };
    const errors = validateProfileUpdate(payload);
    assert.equal(errors.currentPassword, undefined, 'Password should not be required if email is not being updated');
  });

  it('REQ-PROF-01: should return no email/password errors if both are provided and email is valid', () => {
    const payload = { email: 'new.email@example.com', currentPassword: 'password123' };
    const errors = validateProfileUpdate(payload);
    assert.equal(errors.email, undefined);
    assert.equal(errors.currentPassword, undefined);
  });

  it('REQ-PROF-01: should allow partial updates where only non-validated fields are present', () => {
    const payload = { bio: 'This is my new biography.' };
    const errors = validateProfileUpdate(payload);
    assert.deepEqual(errors, {}, 'Updating only a non-validated field like bio should be valid');
  });

  it('REQ-PROF-01: should return multiple errors if multiple fields are invalid', () => {
    const payload = { name: 'X', email: 'invalid-email' };
    const errors = validateProfileUpdate(payload);
    assert.equal(errors.name, 'Name must be at least 2 characters');
    assert.equal(errors.email, 'Please enter a valid email address');
    assert.equal(errors.currentPassword, 'Current password is required to change email');
  });
});