import test from 'node:test';
/**
 * @requirement REQ-PROF-02
 * @source docs/requirements/sub-requirements/REQ-PROF-02.md
 * @generated-by dd-agent app-mode 2026-05-16
 */

import test, { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { validateAvatarFile, uploadAvatar } from '../../../src/user/avatar';
import { apiClient } from '../../../src/utils/api';

// Helper to create a File object safely across different Node versions
function createTestFile(name: string, type: string, size: number): File {
  const content = new Uint8Array(size);
  if (typeof File !== 'undefined') {
    return new File([content], name, { type });
  }
  // Fallback for Node environments where File is not globally available but Blob is
  const blob = new Blob([content], { type });
  Object.defineProperty(blob, 'name', { value: name });
  Object.defineProperty(blob, 'lastModified', { value: Date.now() });
  return blob as unknown as File;
}

describe('Avatar Upload Validation (REQ-PROF-02)', () => {
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Mock localStorage to simulate an active session for getSession()
    originalLocalStorage = globalThis.localStorage;
    globalThis.localStorage = {
      getItem: mock.fn((key: string) => {
        if (key === 'session_token') return 'mock-token-123';
        if (key === 'session_expires_at') return String(Date.now() + 3600000);
        if (key === 'session_last_active') return String(Date.now());
        return null;
      }),
      setItem: mock.fn(),
      removeItem: mock.fn(),
      clear: mock.fn(),
      length: 3,
      key: mock.fn(),
    } as unknown as Storage;
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
    mock.restoreAll();
  });

  describe('validateAvatarFile()', () => {
    it('accepts valid JPEG files under 2MB', () => {
      const file = createTestFile('avatar.jpg', 'image/jpeg', 1024 * 1024); // 1MB
      const result = validateAvatarFile(file);
      assert.equal(result.valid, true);
      assert.equal(result.error, undefined);
    });

    it('accepts valid PNG files under 2MB', () => {
      const file = createTestFile('avatar.png', 'image/png', 2 * 1024 * 1024); // Exactly 2MB
      const result = validateAvatarFile(file);
      assert.equal(result.valid, true);
      assert.equal(result.error, undefined);
    });

    it('rejects unsupported MIME types (e.g., GIF, WebP, PDF)', () => {
      const invalidTypes = ['image/gif', 'image/webp', 'application/pdf'];
      
      for (const type of invalidTypes) {
        const file = createTestFile('file.ext', type, 1024);
        const result = validateAvatarFile(file);
        assert.equal(result.valid, false);
        assert.equal(result.error, 'Only JPEG and PNG files are supported');
      }
    });

    it('rejects files larger than 2MB', () => {
      const file = createTestFile('large.jpg', 'image/jpeg', 2 * 1024 * 1024 + 1); // 2MB + 1 byte
      const result = validateAvatarFile(file);
      assert.equal(result.valid, false);
      assert.equal(result.error, 'File must be under 2MB');
    });
  });

  describe('uploadAvatar()', () => {
    it('validates client-side and prevents network request if file is invalid', async () => {
      const postFormMock = mock.method(apiClient, 'postForm');
      const invalidFile = createTestFile('document.pdf', 'application/pdf', 1024);

      await assert.rejects(
        () => uploadAvatar('user-123', invalidFile),
        { message: 'Only JPEG and PNG files are supported' }
      );

      assert.equal(postFormMock.mock.callCount(), 0, 'Network request should not be made for invalid files');
    });

    it('throws an error if the user is not authenticated', async () => {
      // Clear localStorage mock to simulate missing session
      globalThis.localStorage.getItem = () => null;
      const validFile = createTestFile('avatar.jpg', 'image/jpeg', 1024);

      await assert.rejects(
        () => uploadAvatar('user-123', validFile),
        { message: 'Not authenticated' }
      );
    });

    it('uploads a valid file via multipart/form-data POST to the correct endpoint', async () => {
      const validFile = createTestFile('avatar.png', 'image/png', 1024 * 1024);
      const expectedResponse = { avatarUrl: 'https://example.com/avatars/user-123.png' };
      
      const postFormMock = mock.method(apiClient, 'postForm', async () => expectedResponse);

      const result = await uploadAvatar('user-123', validFile);

      // Assert the API response is returned
      assert.deepEqual(result, expectedResponse);

      // Assert the API client was called exactly once
      assert.equal(postFormMock.mock.callCount(), 1);

      const callArgs = postFormMock.mock.calls[0].arguments;
      
      // Assert endpoint
      assert.equal(callArgs[0], '/users/user-123/avatar');
      
      // Assert FormData payload
      const formData = callArgs[1] as FormData;
      assert.ok(formData instanceof FormData, 'Payload must be a FormData instance');
      assert.equal(formData.get('avatar'), validFile, 'File must be appended to the "avatar" field');

      // Assert authorization token is passed
      assert.deepEqual(callArgs[2], { token: 'mock-token-123' });
    });
  });
});