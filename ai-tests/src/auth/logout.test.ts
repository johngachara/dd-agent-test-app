/**
 * @requirement REQ-AUTH-03
 * @source docs/requirements/sub-requirements/REQ-AUTH-03.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerPendingRequest, cancelAllPendingRequests } from '../../../src/auth/logout';

describe('Pending Request Cancellation', () => {
  // Since the pendingRequests array is a module-level variable,
  // we need to clear it before each test to ensure isolation.
  beforeEach(() => {
    cancelAllPendingRequests();
  });

  it('should cancel all registered pending requests', () => {
    let abort1Called = false;
    let abort2Called = false;

    const mockController1 = {
      abort: () => {
        abort1Called = true;
      },
    } as AbortController;

    const mockController2 = {
      abort: () => {
        abort2Called = true;
      },
    } as AbortController;

    registerPendingRequest(mockController1);
    registerPendingRequest(mockController2);

    cancelAllPendingRequests();

    assert.ok(abort1Called, 'First controller should have been aborted');
    assert.ok(abort2Called, 'Second controller should have been aborted');
  });

  it('should clear the list of pending requests after cancellation', () => {
    let abortCount = 0;
    const mockController = {
      abort: () => {
        abortCount++;
      },
    } as AbortController;

    registerPendingRequest(mockController);
    cancelAllPendingRequests();

    // To verify the list is cleared, we call cancel again.
    // If the list was not cleared, abort would be called a second time.
    cancelAllPendingRequests();

    assert.equal(abortCount, 1, 'Abort should only be called once, proving the list was cleared');
  });

  it('should not throw an error if there are no pending requests', () => {
    assert.doesNotThrow(() => {
      cancelAllPendingRequests();
    });
  });
});