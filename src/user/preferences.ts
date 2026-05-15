import { apiClient } from "../utils/api";
import { getSession } from "../auth/session";

export type Theme = "light" | "dark" | "system";
export type DigestFrequency = "daily" | "weekly" | "never";
export type Language = "en" | "fr" | "es" | "de" | "sw";

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  digest: DigestFrequency;
}

export interface UserPreferences {
  theme: Theme;
  language: Language;
  notifications: NotificationSettings;
  compactView: boolean;
}

export interface PreferencesValidationErrors {
  theme?: string;
  language?: string;
  notifications?: string;
}

const VALID_THEMES: Theme[] = ["light", "dark", "system"];
const VALID_LANGUAGES: Language[] = ["en", "fr", "es", "de", "sw"];
const VALID_DIGEST: DigestFrequency[] = ["daily", "weekly", "never"];

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  language: "en",
  notifications: { email: true, push: false, digest: "weekly" },
  compactView: false,
};

export function validatePreferences(
  prefs: Partial<UserPreferences>
): PreferencesValidationErrors {
  const errors: PreferencesValidationErrors = {};

  if (prefs.theme !== undefined && !VALID_THEMES.includes(prefs.theme)) {
    errors.theme = `Theme must be one of: ${VALID_THEMES.join(", ")}`;
  }

  if (prefs.language !== undefined && !VALID_LANGUAGES.includes(prefs.language)) {
    errors.language = `Language must be one of: ${VALID_LANGUAGES.join(", ")}`;
  }

  if (prefs.notifications !== undefined) {
    const { digest } = prefs.notifications;
    if (!VALID_DIGEST.includes(digest)) {
      errors.notifications = `Digest frequency must be one of: ${VALID_DIGEST.join(", ")}`;
    }
    // If push notifications disabled, digest must be "never"
    if (!prefs.notifications.push && digest !== "never") {
      errors.notifications =
        "Digest frequency must be 'never' when push notifications are disabled";
    }
  }

  return errors;
}

export function mergePreferences(
  current: UserPreferences,
  updates: Partial<UserPreferences>
): UserPreferences {
  return {
    ...current,
    ...updates,
    notifications:
      updates.notifications !== undefined
        ? { ...current.notifications, ...updates.notifications }
        : current.notifications,
  };
}

export async function savePreferences(
  userId: string,
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  const session = getSession();
  if (!session) throw new Error("Not authenticated");

  const errors = validatePreferences(updates);
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0]);
  }

  return apiClient.patch<UserPreferences>(`/users/${userId}/preferences`, updates, {
    token: session.token,
  });
}
