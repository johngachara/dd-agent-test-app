/**
 * @requirement REQ-AUTH-01
 * @source docs/requirements/sub-requirements/REQ-AUTH-01.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LoginForm } from '../../../src/components/LoginForm';

// Note: As per project standards, we do not test React component rendering.
// This test file exists to confirm the component's export signature and fulfill
// the "one test file per source file" project rule. The core validation logic
// is tested in the corresponding validation function's test file.

test('LoginForm component', () => {
  assert.equal(typeof LoginForm, 'function', 'LoginForm should be an exported function');
});