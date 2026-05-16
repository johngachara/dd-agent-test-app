/**
 * @requirement REQ-AUTH-01
 * @source docs/requirements/sub-requirements/REQ-AUTH-01.md
 * @generated-by dd-agent app-mode 2026-05-16
 */

import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { validateLoginForm, login, isLoggedIn } from '../../../src/auth/login';
import { apiClient } from '../../../src/utils/api';

describe('Login Form Validation (REQ-AUTH-01)', () => {
  it('should return errors for empty email and password simultaneously', () => {
    const errors = validateLoginForm({ email: '', password: '' });
    assert.equal(errors.email, 'Email is required');
    assert.equal(errors.password, 'Password is required');
  });

  it('should return errors for whitespace-only email and password', () => {
    const errors = validateLoginForm({ email: '   ', password: '   ' });
    assert.equal(errors.email, 'Email is required');
    assert.equal(errors.password, 'Password is required');
  });

  it('should return error for invalid email format', () => {
    const errors = validateLoginForm({ email: 'invalid-email', password: 'ValidPassword123!' });
    assert.equal(errors.email, 'Please enter a valid email address');
    assert.equal(errors.password, undefined);
  });

  it('should return error for empty password with valid email', () => {
    const errors = validateLoginForm({ email: 'test@example.com', password: '' });
    assert.equal(errors.email, undefined);
    assert.equal(errors.password, 'Password is required');
  });

  it('should return no errors for valid email and password', () => {
    const errors = validateLoginForm({ email: 'test@example.com', password: 'ValidPassword123!' });
    assert.deepEqual(errors, {});
  });
});

describe('Login Submission (REQ-AUTH-01)', () => {
  let postMock: any;

  beforeEach(() => {
    postMock = mock.method(apiClient, 'post', async () => ({ token: 'fake-token', expiresAt: Date.now() + 3600000 }));
    
    (global as any).localStorage = {
      store: {} as Record<string, string>,
      getItem(key: string) { return this.store[key] || null; },
      setItem(key: string, value: string) { this.store[key] = value; },
      removeItem(key: string) { delete this.store[key]; },
      clear() { this.store = {}; }
    };
  });

  afterEach(() => {
    mock.restoreAll();
    delete (global as any).localStorage;
  });

  it('should not submit if validation fails (empty fields)', async () => {
    const result = await login({ email: '', password: '' });
    assert.equal(result.success, false);
    assert.equal(result.error, 'Validation failed');
    assert.equal(postMock.mock.callCount(), 0, 'API should not be called when validation fails');
  });

  it('should not submit if validation fails (invalid email)', async () => {
    const result = await login({ email: 'invalid', password: 'ValidPassword123!' });
    assert.equal(result.success, false);
    assert.equal(result.error, 'Validation failed');
    assert.equal(postMock.mock.callCount(), 0, 'API should not be called when validation fails');
  });

  it('should submit and return success if validation passes', async () => {
    const result = await login({ email: 'test@example.com', password: 'ValidPassword123!' });
    assert.equal(result.success, true);
    assert.equal(postMock.mock.callCount(), 1);
    assert.deepEqual(postMock.mock.calls[0].arguments, [
      '/auth/login',
      { email: 'test@example.com', password: 'ValidPassword123!' }
    ]);
  });

  it('should return error if API call fails', async () => {
    mock.method(apiClient, 'post', async () => { throw new Error('Network error'); });
    const result = await login({ email: 'test@example.com', password: 'ValidPassword123!' });
    assert.equal(result.success, false);
    assert.equal(result.error, 'Network error');
  });
});

describe('isLoggedIn', () => {
  let originalDateNow: () => number;

  beforeEach(() => {
    originalDateNow = Date.now;
    global.Date.now = () => 1000000;
    
    (global as any).localStorage = {
      store: {} as Record<string, string>,
      getItem(key: string) { return this.store[key] || null; },
      setItem(key: string, value: string) { this.store[key] = value; },
      removeItem(key: string) { delete this.store[key]; },
      clear() { this.store = {}; }
    };
  });

  afterEach(() => {
    global.Date.now = originalDateNow;
    delete (global as any).localStorage;
  });

  it('should return false if no token is present', () => {
    assert.equal(isLoggedIn(), false);
  });

  it('should return false if token exists but no expiresAt is present', () => {
    (global as any).localStorage.setItem('session_token', 'fake-token');
    assert.equal(isLoggedIn(), false);
  });

  it('should return false if expiresAt is in the past', () => {
    (global as any).localStorage.setItem('session_token', 'fake-token');
    (global as any).localStorage.setItem('session_expires_at', '999999');
    assert.equal(isLoggedIn(), false);
  });

  it('should return true if expiresAt is in the future', () => {
    (global as any).localStorage.setItem('session_token', 'fake-token');
    (global as any).localStorage.setItem('session_expires_at', '1000001');
    assert.equal(isLoggedIn(), true);
  });
});