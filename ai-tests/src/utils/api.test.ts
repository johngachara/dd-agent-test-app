/**
 * @requirement UNKNOWN
 * @source docs/requirements/sub-requirements/UNKNOWN.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { apiClient } from '../../../src/utils/api';

describe('apiClient', () => {
  it('should export an object with get, post, patch, and postForm methods', () => {
    assert.ok(apiClient, 'apiClient should be exported');
    assert.equal(typeof apiClient.get, 'function', 'should have a get method');
    assert.equal(typeof apiClient.post, 'function', 'should have a post method');
    assert.equal(typeof apiClient.patch, 'function', 'should have a patch method');
    assert.equal(typeof apiClient.postForm, 'function', 'should have a postForm method');
  });

  // Note: Further testing of apiClient functionality requires network mocking or a live server,
  // which is outside the scope of the current test constraints. The basic shape of the
  // exported client is verified.
});