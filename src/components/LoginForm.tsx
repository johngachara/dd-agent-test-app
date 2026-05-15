import { useState } from "react";
import { login, validateLoginForm, type LoginCredentials } from "../auth/login";

export function LoginForm() {
  const [credentials, setCredentials] = useState<LoginCredentials>({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validateLoginForm(credentials);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    const result = await login(credentials);
    setLoading(false);

    if (!result.success) {
      setServerError(result.error ?? "Login failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={credentials.email}
          onChange={handleChange}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && <span id="email-error" role="alert">{errors.email}</span>}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={credentials.password}
          onChange={handleChange}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
        {errors.password && <span id="password-error" role="alert">{errors.password}</span>}
      </div>

      {serverError && <p role="alert">{serverError}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
