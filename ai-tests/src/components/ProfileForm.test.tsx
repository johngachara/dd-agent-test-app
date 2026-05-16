/**
 * @requirement REQ-PROF-01
 * @source docs/requirements/sub-requirements/REQ-PROF-01.md
 * @generated-by dd-agent app-mode 2026-05-16
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { ProfileForm } from '../../../src/components/ProfileForm';

test('ProfileForm component is exported', () => {
  // Per project rules: "Do NOT test React component rendering — only exported functions, utilities, type shapes, pure logic."
  // The actual validation logic (REQ-PROF-01, REQ-PROF-02) is tested in the respective utility modules (profile.ts, avatar.ts).
  // Here we simply verify the component function is exported correctly.
  assert.equal(typeof ProfileForm, 'function', 'ProfileForm should be a function component');
});