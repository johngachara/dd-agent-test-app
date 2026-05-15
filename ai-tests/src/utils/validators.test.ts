import test from 'node:test';
/**
 * @requirement REQ-AUTH-01
 * @source docs/requirements/sub-requirements/REQ-AUTH-01.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from '../../../src/utils/validators';

describe('validators', () => {
  describe('validateEmail', () => {
    it('[REQ-AUTH-01] should return true for valid email addresses', () => {
      assert.strictEqual(validateEmail('test@example.com'), true);
      assert.strictEqual(validateEmail('user.name+tag@gmail.co.uk'), true);
      assert.strictEqual(validateEmail('   leading@space.com '), true, 'should trim whitespace');
    });

    it('[REQ-AUTH-01] should return false for invalid email addresses', () => {
      assert.strictEqual(validateEmail(''), false, 'empty string is invalid');
      assert.strictEqual(validateEmail('plainaddress'), false, 'missing @ and domain');
      assert.strictEqual(validateEmail('@missing-local.com'), false, 'missing local part');
      assert.strictEqual(validateEmail('missing-at.com'), false, 'missing @ symbol');
      assert.strictEqual(validateEmail('user@missing-tld'), false, 'missing top-level domain');
      assert.strictEqual(validateEmail('user@.com'), false, 'domain starts with dot');
      assert.strictEqual(validateEmail('user@domain..com'), false, 'double dot in domain');
      assert.strictEqual(validateEmail('user with space@domain.com'), false, 'space in local part');
    });
  });

  describe('validatePassword', () => {
    it('[REQ-AUTH-05] should return true for passwords with 8 or more characters', () => {
      assert.strictEqual(validatePassword('12345678'), true, '8 characters should be valid');
      assert.strictEqual(validatePassword('password123'), true, 'more than 8 characters should be valid');
    });

    it('[REQ-AUTH-05] should return false for passwords with fewer than 8 characters', () => {
      assert.strictEqual(validatePassword('1234567'), false, '7 characters should be invalid');
      assert.strictEqual(validatePassword(''), false, 'empty string should be invalid');
    });
  });

  describe('validateRequired', () => {
    it('[REQ-AUTH-01] should return undefined for non-empty strings', () => {
      assert.strictEqual(validateRequired('some value', 'Field'), undefined);
      assert.strictEqual(validateRequired(' a ', 'Field'), undefined, 'should be valid with whitespace around');
    });

    it('[REQ-AUTH-01] should return an error message for empty strings', () => {
      assert.strictEqual(validateRequired('', 'Email'), 'Email is required');
    });

    it('[REQ-AUTH-01] should return an error message for strings with only whitespace', () => {
      assert.strictEqual(validateRequired('   ', 'Password'), 'Password is required');
    });

    it('should use the provided fieldName in the error message', () => {
      assert.strictEqual(validateRequired('', 'Custom Field'), 'Custom Field is required');
    });
  });
});