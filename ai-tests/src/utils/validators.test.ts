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
    it('should return true for valid email addresses', () => {
      assert.ok(validateEmail('test@example.com'));
      assert.ok(validateEmail('user.name+tag@gmail.co.uk'));
      assert.ok(validateEmail('a@b.c'));
    });

    it('should return false for invalid email addresses', () => {
      assert.equal(validateEmail(''), false, 'empty string');
      assert.equal(validateEmail('test'), false, 'no @ symbol');
      assert.equal(validateEmail('test@'), false, 'no domain');
      assert.equal(validateEmail('@example.com'), false, 'no local part');
      assert.equal(validateEmail('test@example'), false, 'no TLD');
      assert.equal(validateEmail('test @example.com'), false, 'contains space');
    });

    it('should trim whitespace before validating', () => {
      assert.ok(validateEmail('  test@example.com  '));
    });
  });

  describe('validatePassword', () => {
    it('should return true for passwords with 8 or more characters', () => {
      assert.ok(validatePassword('12345678'));
      assert.ok(validatePassword('a-very-long-password'));
    });

    it('should return false for passwords with fewer than 8 characters', () => {
      assert.equal(validatePassword('1234567'), false);
      assert.equal(validatePassword(''), false);
    });
  });

  describe('validateRequired', () => {
    it('should return undefined for non-empty strings', () => {
      assert.equal(validateRequired('hello', 'Field'), undefined);
      assert.equal(validateRequired(' a ', 'Field'), undefined);
    });

    it('should return an error message for an empty string', () => {
      assert.equal(validateRequired('', 'Email'), 'Email is required');
    });

    it('should return an error message for a whitespace-only string', () => {
      assert.equal(validateRequired('   ', 'Password'), 'Password is required');
    });
  });
});