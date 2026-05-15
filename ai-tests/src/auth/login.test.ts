/**
 * @requirement REQ-AUTH-01
 * @source docs/requirements/sub-requirements/REQ-AUTH-01.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../../../src/utils/api';
import * as session from '../../../src/auth/session';
import { validateLoginForm, login, isLoggedIn } from '../../../src/auth/login';

describe('validateLoginForm', () => {
  it('REQ-AUTH-01: should return an error if the email field is empty', () => {
    const errors = validateLoginForm({ email: '', password: 'password123' });
    assert.deepEqual(errors, { email: 'Email is required' });
  });

  it('REQ-AUTH-01: should return an error if the email field is just whitespace', () => {
    const errors = validateLoginForm({ email: '  ', password: 'password123' });
    assert.deepEqual(errors, { email: 'Email is required' });
  });

  it('REQ-AUTH-01: should return an error for an email without an @ symbol', () => {
    const errors = validateLoginForm({ email: 'test.example.com', password: 'password123' });
    assert.deepEqual(errors, { email: 'Please enter a valid email address' });
  });

  it('REQ-AUTH-01: should return an error for an email without a domain', () => {
    const errors = validateLoginForm({ email: 'test@', password: 'password123' });
    assert.deepEqual(errors, { email: 'Please enter a valid email address' });
  });

  it('REQ-AUTH-01: should return an error if the password field is empty', () => {
    const errors = validateLoginForm({ email: 'test@example.com', password: '' });
    assert.deepEqual(errors, { password: 'Password is required' });
  });

  it('REQ-AUTH-01: should return errors for both fields if both are empty', () => {
    const errors = validateLoginForm({ email: '', password: '' });
    assert.deepEqual(errors, {
      email: 'Email is required',
      password: 'Password is required',
    });
  });

  it('should return an empty object for valid credentials', () => {
    const errors = validateLoginForm({ email: 'test@example.com', password: 'password123' });
    assert.deepEqual(errors, {});
  });
});

describe('login', () => {
  let apiClientMock: any;
  let sessionMock: any;

  beforeEach(() => {
    apiClientMock = mock.method(api.apiClient, 'post', async () => ({
      token: 'fake-token',
      expiresAt: Date.now() + 3600 * 1000,
    }));
    sessionMock = mock.method(session, 'setSession', () => {});
  });

  afterEach(() => {
    apiClientMock.mock.reset();
    sessionMock.mock.reset();
  });

  it('REQ-AUTH-01: should not submit the form if validation fails', async () => {
    const result = await login({ email: '', password: '' });
    assert.deepEqual(result, { success: false, error: 'Validation failed' });
    assert.equal(apiClientMock.mock.callCount(), 0, 'apiClient.post should not be called');
  });

  it('should call apiClient.post and setSession on successful login', async () => {
    const credentials = { email: 'test@example.com', password: 'password123' };
    const result = await login(credentials);

    assert.deepEqual(result, { success: true });
    assert.equal(apiClientMock.mock.callCount(), 1, 'apiClient.post should be called once');
    assert.deepEqual(apiClientMock.mock.calls[0].arguments, ['/auth/login', credentials]);
    assert.equal(sessionMock.mock.callCount(), 1, 'setSession should be called once');
  });

  it('should return an error if the API call fails', async () => {
    apiClientMock.mock.mockImplementationOnce(async () => {
      throw new Error('Invalid credentials');
    });

    const credentials = { email: 'test@example.com', password: 'password123' };
    const result = await login(credentials);

    assert.deepEqual(result, { success: false, error: 'Invalid credentials' });
    assert.equal(sessionMock.mock.callCount(), 0, 'setSession should not be called on failure');
  });
});

describe('isLoggedIn', () => {
  const realLocalStorage = global.localStorage;
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    const mockLocalStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => (mockStorage[key] = value),
      removeItem: (key: string) => delete mockStorage[key],
    };
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'localStorage', {
      value: realLocalStorage,
      writable: true,
    });
  });

  it('should return false if session_token is missing', () => {
    localStorage.setItem('session_expires_at', String(Date.now() + 10000));
    assert.equal(isLoggedIn(), false);
  });

  it('should return false if session_expires_at is missing', () => {
    localStorage.setItem('session_token', 'some-token');
    assert.equal(isLoggedIn(), false);
  });

  it('should return false if the session is expired', () => {
    localStorage.setItem('session_token', 'some-token');
    localStorage.setItem('session_expires_at', String(Date.now() - 1000));
    assert.equal(isLoggedIn(), false);
  });

  it('should return true if the session is active and not expired', () => {
    localStorage.setItem('session_token', 'some-token');
    localStorage.setItem('session_expires_at', String(Date.now() + 10000));
    assert.equal(isLoggedIn(), true);
  });
});