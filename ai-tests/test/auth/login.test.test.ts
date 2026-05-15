/**
 * @requirement REQ-AUTH-01
 * @source docs/requirements/sub-requirements/REQ-AUTH-01.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateLoginForm } from "../../../src/auth/login";

describe("validateLoginForm", () => {
  it("should return an error if the email field is empty", () => {
    const credentials = { email: "", password: "password123" };
    const errors = validateLoginForm(credentials);
    assert.deepEqual(errors, { email: "Email is required" });
  });

  it("should return an error if the email field contains only whitespace", () => {
    const credentials = { email: "  ", password: "password123" };
    const errors = validateLoginForm(credentials);
    assert.deepEqual(errors, { email: "Email is required" });
  });

  it("should return an error if the email field is not a valid email address (no @)", () => {
    const credentials = { email: "test.example.com", password: "password123" };
    const errors = validateLoginForm(credentials);
    assert.deepEqual(errors, { email: "Please enter a valid email address" });
  });

  it("should return an error if the email field is not a valid email address (no domain)", () => {
    const credentials = { email: "test@", password: "password123" };
    const errors = validateLoginForm(credentials);
    assert.deepEqual(errors, { email: "Please enter a valid email address" });
  });

  it("should return an error if the password field is empty", () => {
    const credentials = { email: "test@example.com", password: "" };
    const errors = validateLoginForm(credentials);
    assert.deepEqual(errors, { password: "Password is required" });
  });

  it("should return an error if the password field contains only whitespace", () => {
    const credentials = { email: "test@example.com", password: "   " };
    const errors = validateLoginForm(credentials);
    assert.deepEqual(errors, { password: "Password is required" });
  });

  it("should return errors for both fields if both are empty", () => {
    const credentials = { email: "", password: "" };
    const errors = validateLoginForm(credentials);
    assert.deepEqual(errors, {
      email: "Email is required",
      password: "Password is required",
    });
  });

  it("should return errors for both fields if email is invalid and password is empty", () => {
    const credentials = { email: "invalid-email", password: "" };
    const errors = validateLoginForm(credentials);
    assert.deepEqual(errors, {
      email: "Please enter a valid email address",
      password: "Password is required",
    });
  });

  it("should return no errors if both email and password are valid", () => {
    const credentials = { email: "test@example.com", password: "password123" };
    const errors = validateLoginForm(credentials);
    assert.deepEqual(errors, {});
  });

  // This is a rule from REQ-AUTH-05 but the validator is shared.
  // The error message is different, but the underlying logic is the same.
  it("should return an error if the password is less than 8 characters", () => {
    const credentials = { email: "test@example.com", password: "short" };
    const errors = validateLoginForm(credentials);
    assert.deepEqual(errors, { password: "Password must be at least 8 characters" });
  });
});