/**
 * @requirement REQ-AUTH-05
 * @source docs/requirements/sub-requirements/REQ-AUTH-05.md
 * @generated-by dd-agent app-mode 2026-05-15
 */
import { describe, it, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  validateResetToken,
  validateNewPassword,
  requestPasswordReset,
  resetPassword,
  ResetToken,
} from "../../../src/auth/passwordReset";
import * as api from "../../../src/utils/api";

describe("Password Reset Flow", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  describe("REQ-AUTH-05: Request stage", () => {
    it("should return an error for an invalid email without making an API call", async () => {
      const postMock = mock.method(api.apiClient, "post", async () => ({}));
      const result = await requestPasswordReset("invalid-email");

      assert.deepEqual(result, {
        success: false,
        error: "Please enter a valid email address",
      });
      assert.equal(postMock.mock.calls.length, 0);
    });

    it("should make an API call for a valid email", async () => {
      const postMock = mock.method(api.apiClient, "post", async () => ({}));
      const result = await requestPasswordReset("test@example.com");

      assert.deepEqual(result, { success: true });
      assert.equal(postMock.mock.calls.length, 1);
      assert.equal(postMock.mock.calls[0].arguments[0], "/auth/password-reset/request");
    });
  });

  describe("REQ-AUTH-05: Validate stage", () => {
    it("should return an error for a reset token with fewer than 8 characters", () => {
      const token: ResetToken = { value: "1234567", issuedAt: Date.now() };
      const result = validateResetToken(token);
      assert.deepEqual(result, { success: false, error: "Invalid reset token" });
    });

    it("should return an error for an expired reset token", () => {
      const fifteenMinutesAndOneSecondAgo = Date.now() - 15 * 60 * 1000 - 1;
      const token: ResetToken = { value: "valid-token-length", issuedAt: fifteenMinutesAndOneSecondAgo };
      const result = validateResetToken(token);
      assert.deepEqual(result, {
        success: false,
        error: "Reset token has expired. Please request a new one.",
      });
    });

    it("should return success for a valid, non-expired token", () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const token: ResetToken = { value: "valid-token-length", issuedAt: fiveMinutesAgo };
      const result = validateResetToken(token);
      assert.deepEqual(result, { success: true });
    });
  });

  describe("REQ-AUTH-05: Confirm stage", () => {
    const passwordHistory = ["oldPass1", "oldPass2", "oldPass3", "oldPass4", "oldPass5"];

    it("should return an error if the new password is less than 8 characters", () => {
      const result = validateNewPassword("short", "short", passwordHistory);
      assert.deepEqual(result, {
        success: false,
        error: "Password must be at least 8 characters",
      });
    });

    it("should return an error if the new password and confirmation do not match", () => {
      const result = validateNewPassword("newPassword123", "newPassword456", passwordHistory);
      assert.deepEqual(result, { success: false, error: "Passwords do not match" });
    });

    it("should return an error if the new password matches one of the last 5 passwords", () => {
      const result = validateNewPassword("oldPass3", "oldPass3", passwordHistory);
      assert.deepEqual(result, {
        success: false,
        error: "Cannot reuse any of your last 5 passwords",
      });
    });

    it("should return success for a valid, non-reused password", () => {
      const result = validateNewPassword("brandNewPassword123", "brandNewPassword123", passwordHistory);
      assert.deepEqual(result, { success: true });
    });

    it("should run all validations before making an API call", async () => {
      const postMock = mock.method(api.apiClient, "post", async () => ({}));
      const expiredToken: ResetToken = { value: "valid-token-length", issuedAt: Date.now() - 16 * 60 * 1000 };

      // Test with expired token
      let result = await resetPassword(expiredToken, "newPass123", "newPass123", []);
      assert.equal(result.success, false);
      assert.ok(result.error?.includes("expired"));
      assert.equal(postMock.mock.calls.length, 0);

      // Test with password mismatch
      const validToken: ResetToken = { value: "valid-token-length", issuedAt: Date.now() };
      result = await resetPassword(validToken, "newPass123", "differentPass456", []);
      assert.deepEqual(result, { success: false, error: "Passwords do not match" });
      assert.equal(postMock.mock.calls.length, 0);
    });
  });
});