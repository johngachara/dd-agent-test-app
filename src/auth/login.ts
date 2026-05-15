import { apiClient } from "../utils/api";
import { validateEmail, validatePassword } from "../utils/validators";
import { setSession } from "./session";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginValidationErrors {
  email?: string;
  password?: string;
}

export function validateLoginForm(credentials: LoginCredentials): LoginValidationErrors {
  const errors: LoginValidationErrors = {};

  if (!credentials.email || credentials.email.trim() === "") {
    errors.email = "Email is required";
  } else if (!validateEmail(credentials.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!credentials.password || credentials.password.trim() === "") {
    errors.password = "Password is required";
  } else if (!validatePassword(credentials.password)) {
    errors.password = "Password must be at least 8 characters";
  }

  return errors;
}

export async function login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
  const errors = validateLoginForm(credentials);
  if (Object.keys(errors).length > 0) {
    return { success: false, error: "Validation failed" };
  }

  try {
    const response = await apiClient.post<{ token: string; expiresAt: number }>("/auth/login", credentials);
    setSession({ token: response.token, expiresAt: response.expiresAt });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    return { success: false, error: message };
  }
}

export function isLoggedIn(): boolean {
  const token = localStorage.getItem("session_token");
  const expiresAt = localStorage.getItem("session_expires_at");
  if (!token || !expiresAt) return false;
  return Date.now() < parseInt(expiresAt, 10);
}
