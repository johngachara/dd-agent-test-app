import test from 'node:test';
/**
 * @requirement REQ-UTIL-01
 * @source docs/requirements/sub-requirements/REQ-UTIL-01.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import test, { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkRateLimit,
  recordCall,
  resetEndpoint,
  resetAll,
} from '../../../src/utils/rateLimit';

describe('rateLimit', () => {
  const endpoint = '/api/test';
  const config = { maxCalls: 10, windowMs: 60_000 };

  beforeEach(() => {
    resetAll();
    test.mock.timers.enable();
  });

  afterEach(() => {
    test.mock.timers.reset();
  });

  it('[REQ-UTIL-01] allows calls under the limit', () => {
    recordCall(endpoint);
    const result = checkRateLimit(endpoint, config);
    assert.ok(result.allowed, 'Call should be allowed');
    assert.equal(result.remaining, 8, 'Remaining calls should be 8 after one call');
  });

  it('[REQ-UTIL-01] returns correct remaining count', () => {
    for (let i = 0; i < 5; i++) {
      recordCall(endpoint);
    }
    const result = checkRateLimit(endpoint, config);
    assert.ok(result.allowed);
    assert.equal(result.remaining, 4, 'Remaining calls should be 4 after five calls');
  });

  it('[REQ-UTIL-01] blocks calls when the limit is reached', () => {
    for (let i = 0; i < config.maxCalls; i++) {
      recordCall(endpoint);
    }
    const result = checkRateLimit(endpoint, config);
    assert.strictEqual(result.allowed, false, 'Call should be blocked');
    assert.equal(result.remaining, 0, 'Remaining calls should be 0');
    assert.ok(typeof result.retryAfterMs === 'number', 'retryAfterMs should be a number');
    assert.ok(result.retryAfterMs > 59000 && result.retryAfterMs <= 60000, `retryAfterMs should be around 60000ms, but was ${result.retryAfterMs}`);
  });

  it('[REQ-UTIL-01] ensures retryAfterMs is never negative', () => {
    const now = Date.now();
    test.mock.timers.setTime(now);
    
    for (let i = 0; i < config.maxCalls; i++) {
      recordCall(endpoint);
    }
    
    // Advance time to be exactly when the window expires
    test.mock.timers.setTime(now + config.windowMs + 1);

    const result = checkRateLimit(endpoint, config);
    // Now that the window has passed, the call should be allowed again.
    // But if we were to calculate retryAfterMs for a blocked call, it should be 0.
    // Let's test the blocked case just before it expires.
    test.mock.timers.setTime(now + config.windowMs - 1);
    const blockedResult = checkRateLimit(endpoint, config);
    assert.strictEqual(blockedResult.allowed, false);
    assert.ok(blockedResult.retryAfterMs >= 0);

    // And test a case where it could become negative without the Math.max(0, ...)
    test.mock.timers.setTime(now + config.windowMs + 100);
    const anotherBlockedResult = checkRateLimit(endpoint, config);
    // At this point, all calls are expired, so it's allowed again.
    assert.strictEqual(anotherBlockedResult.allowed, true);
  });

  it('[REQ-UTIL-01] implements a sliding window, not a fixed one', () => {
    const now = Date.now();
    test.mock.timers.setTime(now);

    // Fill the window
    for (let i = 0; i < config.maxCalls; i++) {
      recordCall(endpoint);
      test.mock.timers.tick(1000); // Space out calls by 1 second
    }

    // At this point, limit is reached
    let result = checkRateLimit(endpoint, config);
    assert.strictEqual(result.allowed, false);

    // Advance time so the first call expires, but not the others
    test.mock.timers.setTime(now + config.windowMs + 1);

    // Now a slot should be free
    result = checkRateLimit(endpoint, config);
    assert.strictEqual(result.allowed, true, 'A slot should be free after the oldest call expires');
    assert.equal(result.remaining, 0, 'There should be 0 remaining calls after this one');
  });

  it('[REQ-UTIL-01] separates checking from recording', () => {
    let result = checkRateLimit(endpoint, config);
    assert.ok(result.allowed);
    assert.equal(result.remaining, 9);

    // Check again without recording, remaining should be the same
    result = checkRateLimit(endpoint, config);
    assert.ok(result.allowed);
    assert.equal(result.remaining, 9);

    recordCall(endpoint);

    // Check after recording, remaining should decrease
    result = checkRateLimit(endpoint, config);
    assert.ok(result.allowed);
    assert.equal(result.remaining, 8);
  });

  it('[REQ-UTIL-01] resets a single endpoint', () => {
    recordCall(endpoint);
    recordCall('/api/other');

    resetEndpoint(endpoint);

    const result = checkRateLimit(endpoint, config);
    assert.ok(result.allowed);
    assert.equal(result.remaining, 9, 'Reset endpoint should have full quota');

    const otherResult = checkRateLimit('/api/other', config);
    assert.equal(otherResult.remaining, 8, 'Other endpoint should be unaffected');
  });

  it('[REQ-UTIL-01] maintains independent counters for different endpoints', () => {
    const endpointA = '/api/a';
    const endpointB = '/api/b';

    for (let i = 0; i < 5; i++) {
      recordCall(endpointA);
    }
    recordCall(endpointB);

    const resultA = checkRateLimit(endpointA, config);
    assert.equal(resultA.remaining, 4);

    const resultB = checkRateLimit(endpointB, config);
    assert.equal(resultB.remaining, 8);
  });
});