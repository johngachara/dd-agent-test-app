/**
 * @requirement REQ-PROF-02
 * @source docs/requirements/sub-requirements/REQ-PROF-02.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateAvatarFile } from '../../../src/user/avatar';

// Mock File object for testing
const createMockFile = (name: string, type: string, size: number): File => {
  return {
    name,
    type,
    size,
    lastModified: Date.now(),
    webkitRelativePath: '',
    slice: () => new Blob(),
    stream: () => new ReadableStream(),
    text: async () => '',
    arrayBuffer: async () => new ArrayBuffer(0),
  } as File;
};

const MAX_SIZE_BYTES = 2 * 1024 * 1024;

describe('validateAvatarFile', () => {
  it('REQ-PROF-02: should accept a valid JPEG file under 2MB', () => {
    const file = createMockFile('avatar.jpg', 'image/jpeg', MAX_SIZE_BYTES - 1);
    const result = validateAvatarFile(file);
    assert.ok(result.valid, 'Valid JPEG should be accepted');
    assert.equal(result.error, undefined, 'There should be no error for a valid file');
  });

  it('REQ-PROF-02: should accept a valid PNG file under 2MB', () => {
    const file = createMockFile('avatar.png', 'image/png', MAX_SIZE_BYTES - 1);
    const result = validateAvatarFile(file);
    assert.ok(result.valid, 'Valid PNG should be accepted');
    assert.equal(result.error, undefined, 'There should be no error for a valid file');
  });

  it('REQ-PROF-02: should reject a file with an unsupported MIME type', () => {
    const file = createMockFile('avatar.gif', 'image/gif', 1024);
    const result = validateAvatarFile(file);
    assert.equal(result.valid, false, 'GIF file should be rejected');
    assert.equal(result.error, 'Only JPEG and PNG files are supported', 'Error message for wrong type should be correct');
  });

  it('REQ-PROF-02: should reject a file that is over 2MB', () => {
    const file = createMockFile('avatar.jpg', 'image/jpeg', MAX_SIZE_BYTES + 1);
    const result = validateAvatarFile(file);
    assert.equal(result.valid, false, 'Oversized file should be rejected');
    assert.equal(result.error, 'File must be under 2MB', 'Error message for oversized file should be correct');
  });

  it('REQ-PROF-02: should reject a file that is exactly 2MB', () => {
    const file = createMockFile('avatar.png', 'image/png', MAX_SIZE_BYTES);
    const result = validateAvatarFile(file);
    assert.equal(result.valid, false, 'File of exact max size should be rejected');
    assert.equal(result.error, 'File must be under 2MB', 'Error message for exact max size file should be correct');
  });

  it('REQ-PROF-02: should prioritize the MIME type error over the size error', () => {
    const file = createMockFile('document.pdf', 'application/pdf', MAX_SIZE_BYTES + 100);
    const result = validateAvatarFile(file);
    assert.equal(result.valid, false, 'Invalid file should be rejected');
    assert.equal(result.error, 'Only JPEG and PNG files are supported', 'The type error should be returned even if size is also invalid');
  });
});