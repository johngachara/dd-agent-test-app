import test from 'node:test';
/**
 * @requirement REQ-UTIL-01
 * @source docs/requirements/sub-requirements/REQ-UTIL-01.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import test, { describe, it, beforeEach, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkRateLimit,
  recordCall,
  resetEndpoint,
  resetAll,
  getRemainingCalls,
} from '../../../src/utils/rateLimit';

describe('rateLimiter', () => {
  const endpoint = '/api/test';
  const config = { maxCalls: 10, windowMs: 60_000 };
  let now: number;

  beforeEach(() => {
    resetAll();
    now = Date.now();
    mock.method(Date, 'now', () => now);
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('should allow calls when under the limit', () => {
    const result = checkRateLimit(endpoint, config);
    assert.deepEqual(result, { allowed: true, remaining: 9 });
  });

  it('should correctly report remaining calls', () => {
    assert.equal(getRemainingCalls(endpoint, config), 10);
    recordCall(endpoint);
    recordCall(endpoint);
    assert.equal(getRemainingCalls(endpoint, config), 8);
  });

  it('should block calls when the limit is reached', () => {
    for (let i = 0; i < config.maxCalls; i++) {
      recordCall(endpoint);
    }
    const result = checkRateLimit(endpoint, config);
    assert.equal(result.allowed, false);
    assert.equal(result.remaining, 0);
    assert.ok(typeof result.retryAfterMs === 'number');
  });

  it('should calculate retryAfterMs correctly', () => {
    recordCall(endpoint); // t = now
    now += 10_000; // t = now + 10s
    for (let i = 0; i < config.maxCalls - 1; i++) {
      recordCall(endpoint);
    }

    const result = checkRateLimit(endpoint, config);
    assert.equal(result.allowed, false);
    // The first call was at t=now, it will expire at t=now+60s.
    // Current time is t=now+10s. So it should expire in 50s.
    assert.ok(result.retryAfterMs! > 49_900 && result.retryAfterMs! <= 50_000);
  });

  it('should ensure retryAfterMs is never negative', () => {
    for (let i = 0; i < config.maxCalls; i++) {
      recordCall(endpoint);
    }
    now += config.windowMs + 1000; // Advance time beyond the window
    const result = checkRateLimit(endpoint, config);
    // The check prunes expired calls, so we should be allowed again.
    // But if it were to calculate retryAfterMs, it must be >= 0.
    // Let's test the blocked case logic by checking before pruning.
    const blockedResult = checkRateLimit(endpoint, { maxCalls: 0, windowMs: 1000 });
    assert.equal(blockedResult.retryAfterMs, 0);
  });

  it('should implement a sliding window, not a fixed one', () => {
    // Make 5 calls
    for (let i = 0; i < 5; i++) {
      recordCall(endpoint);
      now += 10_000; // 10s apart
    }
    // At this point, 5 calls made, last one at now+40s.
    // Remaining should be 5.
    assert.equal(getRemainingCalls(endpoint, config), 5);

    // Advance time so the first call expires
    now += 20_001; // Total elapsed: 60,001ms. First call at t=0 is now expired.
    assert.equal(getRemainingCalls(endpoint, config), 6); // One slot freed up
  });

  it('should separate checkRateLimit and recordCall operations', () => {
    // Checking does not consume a slot
    checkRateLimit(endpoint, config);
    checkRateLimit(endpoint, config);
    assert.equal(getRemainingCalls(endpoint, config), 10);

    // Recording consumes a slot
    recordCall(endpoint);
    assert.equal(getRemainingCalls(endpoint, config), 9);
  });

  it('should handle different endpoints independently', () => {
    const endpoint1 = '/api/ep1';
    const endpoint2 = '/api/ep2';

    for (let i = 0; i < 5; i++) {
      recordCall(endpoint1);
    }
    recordCall(endpoint2);

    assert.equal(getRemainingCalls(endpoint1, config), 5);
    assert.equal(getRemainingCalls(endpoint2, config), 9);
  });

  it('should reset a single endpoint with resetEndpoint', () => {
    const endpoint1 = '/api/ep1';
    const endpoint2 = '/api/ep2';
    recordCall(endpoint1);
    recordCall(endpoint2);

    resetEndpoint(endpoint1);

    assert.equal(getRemainingCalls(endpoint1, config), 10);
    assert.equal(getRemainingCalls(endpoint2, config), 9);
  });

  it('should reset all endpoints with resetAll', () => {
    const endpoint1 = '/api/ep1';
    const endpoint2 = '/api/ep2';
    recordCall(endpoint1);
    recordCall(endpoint2);

    resetAll();

    assert.equal(getRemainingCalls(endpoint1, config), 10);
    assert.equal(getRemainingCalls(endpoint2, config), 10);
  });
});