/**
 * @requirement REQ-AUTH-01
 * @requirement REQ-AUTH-05
 * @requirement REQ-PROF-01
 * @source docs/requirements/sub-requirements/REQ-AUTH-01.md
 * @source docs/requirements/sub-requirements/REQ-AUTH-05.md
 * @source docs/requirements/sub-requirements/REQ-PROF-01.md
 * @generated-by dd-agent app-mode 2026-05-16
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateEmail, validatePassword, validateRequired } from '../../../src/utils/validators';

describe('validators', () => {
  describe('validateEmail', () => {
    it('returns true for a valid email address', () => {
      assert.equal(validateEmail('user@example.com'), true);
      assert.equal(validateEmail('firstname.lastname@domain.co.uk'), true);
    });

    it('returns false if there is no @ symbol', () => {
      assert.equal(validateEmail('userexample.com'), false);
      assert.equal(validateEmail('justastring'), false);
    });

    it('returns false if there is no domain', () => {
      assert.equal(validateEmail('user@'), false);
      assert.equal(validateEmail('@example.com'), false);
      assert.equal(validateEmail('user@.com'), false);
      assert.equal(validateEmail('user@domain'), false); // Missing TLD based on regex
    });

    it('returns false for empty or whitespace strings', () => {
      assert.equal(validateEmail(''), false);
      assert.equal(validateEmail('   '), false);
    });
  });

  describe('validatePassword', () => {
    it('returns true for passwords with exactly 8 characters', () => {
      assert.equal(validatePassword('12345678'), true);
    });

    it('returns true for passwords with more than 8 characters', () => {
      assert.equal(validatePassword('1234567890'), true);
    });

    it('returns false for passwords with fewer than 8 characters', () => {
      assert.equal(validatePassword('1234567'), false);
      assert.equal(validatePassword('short'), false);
      assert.equal(validatePassword(''), false);
    });
  });

  describe('validateRequired', () => {
    it('returns formatted error message if value is empty', () => {
      assert.equal(validateRequired('', 'Email'), 'Email is required');
      assert.equal(validateRequired('', 'Password'), 'Password is required');
    });

    it('returns formatted error message if value is only whitespace', () => {
      assert.equal(validateRequired('   ', 'Email'), 'Email is required');
    });

    it('returns undefined if value is provided and not empty', () => {
      assert.equal(validateRequired('user@example.com', 'Email'), undefined);
      assert.equal(validateRequired('my-password', 'Password'), undefined);
    });
  });
});