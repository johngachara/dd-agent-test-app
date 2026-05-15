import { apiClient } from "../utils/api";
import { getSession } from "../auth/session";

const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export interface AvatarValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAvatarFile(file: File): AvatarValidationResult {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Only JPEG and PNG files are supported" };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: "File must be under 2MB" };
  }
  return { valid: true };
}

export async function uploadAvatar(userId: string, file: File): Promise<{ avatarUrl: string }> {
  const validation = validateAvatarFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const session = getSession();
  if (!session) throw new Error("Not authenticated");

  const formData = new FormData();
  formData.append("avatar", file);

  return apiClient.postForm<{ avatarUrl: string }>(`/users/${userId}/avatar`, formData, {
    token: session.token,
  });
}
