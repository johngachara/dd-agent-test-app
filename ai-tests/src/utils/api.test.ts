import test from 'node:test';
/**
 * @requirement REQ-PROF-02
 * @source docs/requirements/sub-requirements/REQ-PROF-02.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import test, { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { apiClient } from '../../../src/utils/api';

const BASE_URL = process.env.VITE_API_URL ?? "https://api.example.com";

describe('apiClient', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  describe('get', () => {
    it('should make a GET request to the correct endpoint', async () => {
      const fetchMock = mock.fn(global.fetch, async () => new Response(JSON.stringify({ data: 'ok' }), { status: 200 }));
      await apiClient.get('/test');
      assert.equal(fetchMock.mock.calls.length, 1);
      const [url, options] = fetchMock.mock.calls[0].arguments;
      assert.equal(url, `${BASE_URL}/test`);
      assert.equal(options?.method, 'GET');
    });

    it('should include the Authorization header when a token is provided', async () => {
      const fetchMock = mock.fn(global.fetch, async () => new Response(JSON.stringify({ data: 'ok' }), { status: 200 }));
      await apiClient.get('/test', { token: 'my-token' });
      assert.equal(fetchMock.mock.calls.length, 1);
      const options = fetchMock.mock.calls[0].arguments[1];
      assert.deepEqual(options?.headers, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer my-token',
      });
    });

    it('should parse and return the JSON response on success', async () => {
      mock.method(global, 'fetch', async () => new Response(JSON.stringify({ id: 123 }), { status: 200 }));
      const result = await apiClient.get<{ id: number }>('/test');
      assert.deepEqual(result, { id: 123 });
    });

    it('should throw an error with the response text on failure', async () => {
      mock.method(global, 'fetch', async () => new Response('Unauthorized', { status: 401 }));
      await assert.rejects(
        () => apiClient.get('/test'),
        new Error('Unauthorized')
      );
    });
  });

  describe('post', () => {
    it('should make a POST request with a JSON body', async () => {
      const fetchMock = mock.fn(global.fetch, async () => new Response(JSON.stringify({ success: true }), { status: 201 }));
      const body = { name: 'test' };
      await apiClient.post('/test', body, { token: 'my-token' });

      assert.equal(fetchMock.mock.calls.length, 1);
      const [url, options] = fetchMock.mock.calls[0].arguments;
      assert.equal(url, `${BASE_URL}/test`);
      assert.equal(options?.method, 'POST');
      assert.equal(options?.body, JSON.stringify(body));
      assert.deepEqual(options?.headers, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer my-token',
      });
    });

    it('should throw an error on a non-2xx response', async () => {
      mock.method(global, 'fetch', async () => new Response('Server Error', { status: 500 }));
      await assert.rejects(
        () => apiClient.post('/test', { name: 'test' }),
        new Error('Server Error')
      );
    });
  });

  describe('patch', () => {
    it('should make a PATCH request with a JSON body', async () => {
      const fetchMock = mock.fn(global.fetch, async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
      const body = { name: 'updated' };
      await apiClient.patch('/test/1', body);

      assert.equal(fetchMock.mock.calls.length, 1);
      const [url, options] = fetchMock.mock.calls[0].arguments;
      assert.equal(url, `${BASE_URL}/test/1`);
      assert.equal(options?.method, 'PATCH');
      assert.equal(options?.body, JSON.stringify(body));
    });
  });

  describe('postForm', () => {
    it('should make a POST request with FormData', async () => {
      const fetchMock = mock.fn(global.fetch, async () => new Response(JSON.stringify({ avatarUrl: 'new-url' }), { status: 200 }));
      const formData = new FormData();
      formData.append('avatar', new Blob(['file-content']), 'avatar.png');

      await apiClient.postForm('/users/1/avatar', formData, { token: 'my-token' });

      assert.equal(fetchMock.mock.calls.length, 1);
      const [url, options] = fetchMock.mock.calls[0].arguments;
      assert.equal(url, `${BASE_URL}/users/1/avatar`);
      assert.equal(options?.method, 'POST');
      assert.ok(options?.body instanceof FormData, 'Body should be FormData');
      assert.deepEqual(options?.headers, {
        'Authorization': 'Bearer my-token',
      });
    });

    it('should return parsed JSON on success', async () => {
      mock.method(global, 'fetch', async () => new Response(JSON.stringify({ avatarUrl: 'http://example.com/avatar.png' }), { status: 200 }));
      const result = await apiClient.postForm<{ avatarUrl: string }>('/upload', new FormData());
      assert.deepEqual(result, { avatarUrl: 'http://example.com/avatar.png' });
    });

    it('should throw an error on failure', async () => {
      mock.method(global, 'fetch', async () => new Response('Invalid file type', { status: 400 }));
      await assert.rejects(
        () => apiClient.postForm('/upload', new FormData()),
        new Error('Invalid file type')
      );
    });
  });
});