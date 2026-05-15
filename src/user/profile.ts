import { apiClient } from "../utils/api";
import { validateEmail } from "../utils/validators";
import { getSession } from "../auth/session";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatarUrl?: string;
}

export interface ProfileUpdatePayload {
  name?: string;
  bio?: string;
  email?: string;
  currentPassword?: string;
}

export interface ProfileValidationErrors {
  name?: string;
  email?: string;
  currentPassword?: string;
}

export function validateProfileUpdate(payload: ProfileUpdatePayload): ProfileValidationErrors {
  const errors: ProfileValidationErrors = {};

  if (payload.name !== undefined && payload.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }

  if (payload.email !== undefined) {
    if (!validateEmail(payload.email)) {
      errors.email = "Please enter a valid email address";
    } else if (!payload.currentPassword) {
      errors.currentPassword = "Current password is required to change email";
    }
  }

  return errors;
}

export async function getProfile(userId: string): Promise<UserProfile> {
  const session = getSession();
  if (!session) throw new Error("Not authenticated");

  return apiClient.get<UserProfile>(`/users/${userId}`, { token: session.token });
}

export async function updateProfile(
  userId: string,
  payload: ProfileUpdatePayload
): Promise<UserProfile> {
  const session = getSession();
  if (!session) throw new Error("Not authenticated");

  const errors = validateProfileUpdate(payload);
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0]);
  }

  return apiClient.patch<UserProfile>(`/users/${userId}`, payload, { token: session.token });
}
