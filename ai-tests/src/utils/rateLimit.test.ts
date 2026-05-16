/**
 * @requirement REQ-UTIL-01
 * @source docs/requirements/sub-requirements/REQ-UTIL-01.md
 * @generated-by dd-agent app-mode 2026-05-16
 */
import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkRateLimit,
  recordCall,
  resetEndpoint,
  resetAll
} from '../../../src/utils/rateLimit';

describe('REQ-UTIL-01 - Client-side rate limiting', () => {
  let currentTime = 1000000;

  beforeEach(() => {
    resetAll();
    currentTime = 1000000;
    mock.method(Date, 'now', () => currentTime);
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('returns allowed: true and remaining count when below limit', () => {
    const result = checkRateLimit('test-endpoint');
    assert.equal(result.allowed, true);
    // 10 max calls - 0 active - 1 (for the current check) = 9 remaining
    assert.equal(result.remaining, 9);
  });

  it('returns allowed: false, remaining: 0, and retryAfterMs when limit is reached', () => {
    for (let i = 0; i < 10; i++) {
      recordCall('test-endpoint');
    }
    
    const result = checkRateLimit('test-endpoint');
    assert.equal(result.allowed, false);
    assert.equal(result.remaining, 0);
    assert.equal(result.retryAfterMs, 60000); // 60s default window
  });

  it('does not count calls older than the sliding window', () => {
    for (let i = 0; i < 10; i++) {
      recordCall('test-endpoint');
    }
    assert.equal(checkRateLimit('test-endpoint').allowed, false);

    // Advance time past the 60s window
    currentTime += 60001;

    const result = checkRateLimit('test-endpoint');
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 9); // All previous calls aged out
  });

  it('separates recordCall and checkRateLimit operations', () => {
    // Checking does not automatically record a call
    checkRateLimit('test-endpoint');
    checkRateLimit('test-endpoint');
    checkRateLimit('test-endpoint');

    const result = checkRateLimit('test-endpoint');
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 9); // Still 9, meaning 0 calls were recorded
  });

  it('clears history for a single endpoint without affecting others via resetEndpoint', () => {
    for (let i = 0; i < 10; i++) {
      recordCall('endpoint-a');
      recordCall('endpoint-b');
    }

    assert.equal(checkRateLimit('endpoint-a').allowed, false);
    assert.equal(checkRateLimit('endpoint-b').allowed, false);

    resetEndpoint('endpoint-a');

    assert.equal(checkRateLimit('endpoint-a').allowed, true);
    assert.equal(checkRateLimit('endpoint-b').allowed, false); // Still blocked
  });

  it('maintains completely independent counters for different endpoints', () => {
    for (let i = 0; i < 10; i++) {
      recordCall('endpoint-x');
    }

    assert.equal(checkRateLimit('endpoint-x').allowed, false);

    const resultY = checkRateLimit('endpoint-y');
    assert.equal(resultY.allowed, true);
    assert.equal(resultY.remaining, 9);
  });

  it('calculates retryAfterMs correctly as time advances and ensures it is never negative', () => {
    recordCall('test-endpoint'); // Call 1 at T=0
    
    currentTime += 10000; // Advance 10s
    for (let i = 0; i < 9; i++) {
      recordCall('test-endpoint'); // Calls 2-10 at T=10s
    }

    // Limit reached. Oldest call is at T=0. Window is 60s.
    // At T=10s, retryAfterMs for the oldest call should be 50s (50000ms).
    const result1 = checkRateLimit('test-endpoint');
    assert.equal(result1.allowed, false);
    assert.equal(result1.retryAfterMs, 50000);

    currentTime += 20000; // Advance another 20s (T=30s)
    const result2 = checkRateLimit('test-endpoint');
    assert.equal(result2.allowed, false);
    assert.equal(result2.retryAfterMs, 30000);
    
    currentTime += 30000; // Advance another 30s (T=60s)
    // The oldest call (at T=0) is now exactly at the window boundary.
    // The next check will prune it, opening up a slot.
    const result3 = checkRateLimit('test-endpoint');
    assert.equal(result3.allowed, true);
    assert.equal(result3.remaining, 0); // 1 slot opened, minus 1 for the check = 0
  });
});