import test from 'node:test';
/**
 * @requirement UNKNOWN
 * @source docs/requirements/sub-requirements/UNKNOWN.md
 * @generated-by dd-agent app-mode 2026-05-16
 */

import test, { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { apiClient } from '../../../src/utils/api';

describe('apiClient', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  describe('request (GET, POST, PATCH)', () => {
    it('should perform a GET request and return JSON', async () => {
      const fetchMock = mock.method(globalThis, 'fetch', async () => {
        return {
          ok: true,
          json: async () => ({ data: 'test' })
        } as Response;
      });

      const result = await apiClient.get('/test');
      assert.deepEqual(result, { data: 'test' });
      
      assert.equal(fetchMock.mock.calls.length, 1);
      const [url, options] = fetchMock.mock.calls[0].arguments;
      assert.ok(url.toString().endsWith('/test'));
      assert.equal(options.method, 'GET');
      assert.equal(options.headers['Content-Type'], 'application/json');
      assert.equal(options.body, undefined);
    });

    it('should perform a POST request with JSON body', async () => {
      const fetchMock = mock.method(globalThis, 'fetch', async () => {
        return {
          ok: true,
          json: async () => ({ success: true })
        } as Response;
      });

      const result = await apiClient.post('/post', { foo: 'bar' });
      assert.deepEqual(result, { success: true });

      const [, options] = fetchMock.mock.calls[0].arguments;
      assert.equal(options.method, 'POST');
      assert.equal(options.body, JSON.stringify({ foo: 'bar' }));
      assert.equal(options.headers['Content-Type'], 'application/json');
    });

    it('should perform a PATCH request with JSON body', async () => {
      const fetchMock = mock.method(globalThis, 'fetch', async () => {
        return {
          ok: true,
          json: async () => ({ updated: true })
        } as Response;
      });

      const result = await apiClient.patch('/patch', { foo: 'baz' });
      assert.deepEqual(result, { updated: true });

      const [, options] = fetchMock.mock.calls[0].arguments;
      assert.equal(options.method, 'PATCH');
      assert.equal(options.body, JSON.stringify({ foo: 'baz' }));
    });

    it('should attach Authorization header if token is provided', async () => {
      const fetchMock = mock.method(globalThis, 'fetch', async () => {
        return {
          ok: true,
          json: async () => ({})
        } as Response;
      });

      await apiClient.get('/secure', { token: 'my-token' });

      const [, options] = fetchMock.mock.calls[0].arguments;
      assert.equal(options.headers['Authorization'], 'Bearer my-token');
    });

    it('should throw an error with response text on non-2xx responses', async () => {
      mock.method(globalThis, 'fetch', async () => {
        return {
          ok: false,
          status: 400,
          text: async () => 'Bad Request Error Message'
        } as Response;
      });

      await assert.rejects(
        async () => {
          await apiClient.get('/error');
        },
        (err: Error) => {
          assert.equal(err.message, 'Bad Request Error Message');
          return true;
        }
      );
    });

    it('should fallback to HTTP status if response text is empty on error', async () => {
      mock.method(globalThis, 'fetch', async () => {
        return {
          ok: false,
          status: 500,
          text: async () => ''
        } as Response;
      });

      await assert.rejects(
        async () => {
          await apiClient.get('/error');
        },
        (err: Error) => {
          assert.equal(err.message, 'HTTP 500');
          return true;
        }
      );
    });
  });

  describe('postForm', () => {
    it('should perform a POST request with FormData and no Content-Type header', async () => {
      const fetchMock = mock.method(globalThis, 'fetch', async () => {
        return {
          ok: true,
          json: async () => ({ avatarUrl: 'http://example.com/avatar.png' })
        } as Response;
      });

      const formData = new FormData();
      formData.append('avatar', 'file-content');

      const result = await apiClient.postForm('/users/1/avatar', formData, { token: 'token123' });
      assert.deepEqual(result, { avatarUrl: 'http://example.com/avatar.png' });

      const [, options] = fetchMock.mock.calls[0].arguments;
      assert.equal(options.method, 'POST');
      assert.equal(options.body, formData);
      assert.equal(options.headers['Authorization'], 'Bearer token123');
      assert.equal(options.headers['Content-Type'], undefined);
    });

    it('should throw an error with response text on non-2xx responses for postForm', async () => {
      mock.method(globalThis, 'fetch', async () => {
        return {
          ok: false,
          status: 413,
          text: async () => 'Payload Too Large'
        } as Response;
      });

      const formData = new FormData();
      await assert.rejects(
        async () => {
          await apiClient.postForm('/upload', formData);
        },
        (err: Error) => {
          assert.equal(err.message, 'Payload Too Large');
          return true;
        }
      );
    });
  });
});