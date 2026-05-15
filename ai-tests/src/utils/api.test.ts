import test from 'node:test';
/**
 * @requirement REQ-PROF-02
 * @source docs/requirements/sub-requirements/REQ-PROF-02.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import test, { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { apiClient } from '../../../src/utils/api';

const BASE_URL = process.env.VITE_API_URL ?? "https://api.example.com";

describe('apiClient', () => {
  const mockFetch = mock.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mock.resetCalls();
  });

  afterEach(() => {
    mock.reset();
  });

  describe('get', () => {
    it('should make a GET request without a token', async () => {
      mockFetch.mock.mockImplementationOnce(async () => new Response(JSON.stringify({ data: 'ok' }), { status: 200 }));
      const result = await apiClient.get('/test');
      assert.deepEqual(result, { data: 'ok' });
      assert.equal(mockFetch.mock.calls.length, 1);
      const [url, options] = mockFetch.mock.calls[0].arguments;
      assert.equal(url, `${BASE_URL}/test`);
      assert.equal(options.method, 'GET');
      assert.deepEqual(options.headers, { 'Content-Type': 'application/json' });
      assert.equal(options.body, undefined);
    });

    it('should make a GET request with a token', async () => {
      mockFetch.mock.mockImplementationOnce(async () => new Response(JSON.stringify({ data: 'ok' }), { status: 200 }));
      await apiClient.get('/test', { token: 'my-token' });
      assert.equal(mockFetch.mock.calls.length, 1);
      const [, options] = mockFetch.mock.calls[0].arguments;
      assert.deepEqual(options.headers, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer my-token',
      });
    });

    it('should throw an error on non-ok response', async () => {
      mockFetch.mock.mockImplementationOnce(async () => new Response('Unauthorized', { status: 401 }));
      await assert.rejects(
        apiClient.get('/test'),
        new Error('Unauthorized')
      );
    });
  });

  describe('post', () => {
    it('should make a POST request with a JSON body', async () => {
      mockFetch.mock.mockImplementationOnce(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 }));
      const body = { name: 'test' };
      const result = await apiClient.post('/items', body, { token: 'my-token' });
      assert.deepEqual(result, { id: 1 });
      assert.equal(mockFetch.mock.calls.length, 1);
      const [url, options] = mockFetch.mock.calls[0].arguments;
      assert.equal(url, `${BASE_URL}/items`);
      assert.equal(options.method, 'POST');
      assert.deepEqual(options.headers, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer my-token',
      });
      assert.equal(options.body, JSON.stringify(body));
    });

    it('should throw an error on failure', async () => {
        mockFetch.mock.mockImplementationOnce(async () => new Response('Server Error', { status: 500 }));
        await assert.rejects(
          apiClient.post('/items', { name: 'test' }),
          new Error('Server Error')
        );
      });
  });

  describe('patch', () => {
    it('should make a PATCH request with a JSON body', async () => {
      mockFetch.mock.mockImplementationOnce(async () => new Response(JSON.stringify({ id: 1, name: 'updated' }), { status: 200 }));
      const body = { name: 'updated' };
      const result = await apiClient.patch('/items/1', body, { token: 'my-token' });
      assert.deepEqual(result, { id: 1, name: 'updated' });
      assert.equal(mockFetch.mock.calls.length, 1);
      const [url, options] = mockFetch.mock.calls[0].arguments;
      assert.equal(url, `${BASE_URL}/items/1`);
      assert.equal(options.method, 'PATCH');
      assert.deepEqual(options.headers, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer my-token',
      });
      assert.equal(options.body, JSON.stringify(body));
    });
  });

  describe('postForm', () => {
    it('should make a POST request with FormData', async () => {
      mockFetch.mock.mockImplementationOnce(async () => new Response(JSON.stringify({ avatarUrl: '/path/to/avatar.png' }), { status: 200 }));
      const formData = new FormData();
      const blob = new Blob(['avatar-content'], { type: 'image/png' });
      formData.append('avatar', blob, 'avatar.png');

      const result = await apiClient.postForm('/users/123/avatar', formData, { token: 'my-token' });
      
      assert.deepEqual(result, { avatarUrl: '/path/to/avatar.png' });
      assert.equal(mockFetch.mock.calls.length, 1);
      const [url, options] = mockFetch.mock.calls[0].arguments;
      assert.equal(url, `${BASE_URL}/users/123/avatar`);
      assert.equal(options.method, 'POST');
      // Note: When using FormData with fetch, the browser automatically sets the
      // Content-Type header to multipart/form-data with the correct boundary.
      // We should not set it manually, so we check that it's absent here.
      assert.deepEqual(options.headers, {
        'Authorization': 'Bearer my-token',
      });
      assert.ok(options.body instanceof FormData);
      assert.equal((options.body as FormData).get('avatar'), formData.get('avatar'));
    });

    it('should throw an error on failure', async () => {
        mockFetch.mock.mockImplementationOnce(async () => new Response('Invalid file type', { status: 400 }));
        const formData = new FormData();
        await assert.rejects(
          apiClient.postForm('/upload', formData),
          new Error('Invalid file type')
        );
      });
  });
});