/**
 * @requirement REQ-AUTH-01
 * @source docs/requirements/sub-requirements/REQ-AUTH-01.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from '../../../src/utils/validators';

describe('validators', () => {
  describe('validateEmail', () => {
    it('REQ-AUTH-01: should return true for a valid email address', () => {
      assert.ok(validateEmail('test@example.com'));
    });

    it('REQ-AUTH-01: should return true for a valid email with subdomains', () => {
      assert.ok(validateEmail('test@mail.example.com'));
    });

    it('REQ-AUTH-01: should return true for a valid email and trim whitespace', () => {
      assert.ok(validateEmail('  test@example.com  '));
    });

    it('REQ-AUTH-01: should return false for an email without an @ symbol', () => {
      assert.equal(validateEmail('testexample.com'), false);
    });

    it('REQ-AUTH-01: should return false for an email without a domain', () => {
      assert.equal(validateEmail('test@'), false);
    });

    it('REQ-AUTH-01: should return false for an email without a user part', () => {
      assert.equal(validateEmail('@example.com'), false);
    });

    it('REQ-AUTH-01: should return false for an empty string', () => {
      assert.equal(validateEmail(''), false);
    });
  });

  describe('validatePassword', () => {
    it('should return true for a password of 8 characters', () => {
      assert.ok(validatePassword('12345678'));
    });

    it('should return true for a password longer than 8 characters', () => {
      assert.ok(validatePassword('123456789'));
    });

    it('should return false for a password shorter than 8 characters', () => {
      assert.equal(validatePassword('1234567'), false);
    });

    it('should return false for an empty password', () => {
      assert.equal(validatePassword(''), false);
    });
  });

  describe('validateRequired', () => {
    it('REQ-AUTH-01: should return undefined for a non-empty string', () => {
      assert.equal(validateRequired('some value', 'Field'), undefined);
    });

    it('REQ-AUTH-01: should return an error message for an empty string', () => {
      assert.equal(validateRequired('', 'Email'), 'Email is required');
    });

    it('REQ-AUTH-01: should return an error message for a string with only whitespace', () => {
      assert.equal(validateRequired('   ', 'Password'), 'Password is required');
    });

    it('REQ-AUTH-01: should return undefined for a non-empty string that has whitespace to be trimmed', () => {
      assert.equal(validateRequired('  value  ', 'Field'), undefined);
    });
  });
});