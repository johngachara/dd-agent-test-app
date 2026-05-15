import { apiClient } from "../utils/api";
import { validateEmail, validatePassword } from "../utils/validators";

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // tokens expire after 15 minutes
const PASSWORD_HISTORY_LIMIT = 5;

export interface ResetToken {
  value: string;
  issuedAt: number; // Unix ms
}

export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

export function isResetTokenExpired(token: ResetToken): boolean {
  return Date.now() - token.issuedAt >= RESET_TOKEN_TTL_MS;
}

export function validateResetToken(token: ResetToken): PasswordResetResult {
  if (!token.value || token.value.trim().length < 8) {
    return { success: false, error: "Invalid reset token" };
  }
  if (isResetTokenExpired(token)) {
    return { success: false, error: "Reset token has expired. Please request a new one." };
  }
  return { success: true };
}

export function isPasswordReused(newPassword: string, history: string[]): boolean {
  const recent = history.slice(-PASSWORD_HISTORY_LIMIT);
  return recent.includes(newPassword);
}

export function validateNewPassword(
  newPassword: string,
  confirmPassword: string,
  history: string[] = []
): PasswordResetResult {
  if (!validatePassword(newPassword)) {
    return { success: false, error: "Password must be at least 8 characters" };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }
  if (isPasswordReused(newPassword, history)) {
    return {
      success: false,
      error: `Cannot reuse any of your last ${PASSWORD_HISTORY_LIMIT} passwords`,
    };
  }
  return { success: true };
}

export async function requestPasswordReset(email: string): Promise<PasswordResetResult> {
  if (!validateEmail(email)) {
    return { success: false, error: "Please enter a valid email address" };
  }
  try {
    await apiClient.post("/auth/password-reset/request", { email });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Request failed" };
  }
}

export async function resetPassword(
  resetToken: ResetToken,
  newPassword: string,
  confirmPassword: string,
  passwordHistory: string[] = []
): Promise<PasswordResetResult> {
  const tokenResult = validateResetToken(resetToken);
  if (!tokenResult.success) return tokenResult;

  const passwordResult = validateNewPassword(newPassword, confirmPassword, passwordHistory);
  if (!passwordResult.success) return passwordResult;

  try {
    await apiClient.post("/auth/password-reset/confirm", {
      token: resetToken.value,
      newPassword,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Reset failed" };
  }
}
