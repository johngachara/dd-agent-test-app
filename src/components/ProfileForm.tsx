import { useState } from "react";
import { updateProfile, validateProfileUpdate, type UserProfile, type ProfileUpdatePayload } from "../user/profile";
import { uploadAvatar, validateAvatarFile } from "../user/avatar";

interface ProfileFormProps {
  profile: UserProfile;
  onSaved: (updated: UserProfile) => void;
}

export function ProfileForm({ profile, onSaved }: ProfileFormProps) {
  const [payload, setPayload] = useState<ProfileUpdatePayload>({
    name: profile.name,
    bio: profile.bio,
    email: profile.email,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const emailChanged = payload.email !== profile.email;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setPayload((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = validateAvatarFile(file);
    if (!result.valid) {
      setAvatarError(result.error ?? "Invalid file");
      return;
    }
    setAvatarError(null);
    await uploadAvatar(profile.id, file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullPayload: ProfileUpdatePayload = {
      ...payload,
      ...(emailChanged ? { currentPassword } : {}),
    };

    const validationErrors = validateProfileUpdate(fullPayload);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors as Record<string, string>);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile(profile.id, fullPayload);
      onSaved(updated);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" value={payload.name ?? ""} onChange={handleChange} />
        {errors.name && <span role="alert">{errors.name}</span>}
      </div>

      <div>
        <label htmlFor="bio">Bio</label>
        <textarea id="bio" name="bio" value={payload.bio ?? ""} onChange={handleChange} />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={payload.email ?? ""} onChange={handleChange} />
        {errors.email && <span role="alert">{errors.email}</span>}
      </div>

      {emailChanged && (
        <div>
          <label htmlFor="currentPassword">Current password (required to change email)</label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          {errors.currentPassword && <span role="alert">{errors.currentPassword}</span>}
        </div>
      )}

      <div>
        <label htmlFor="avatar">Profile picture (JPEG/PNG, max 2MB)</label>
        <input id="avatar" type="file" accept="image/jpeg,image/png" onChange={handleAvatarChange} />
        {avatarError && <span role="alert">{avatarError}</span>}
      </div>

      {errors.form && <p role="alert">{errors.form}</p>}

      <button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
