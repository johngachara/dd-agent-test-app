const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

export function validateRequired(value: string, fieldName: string): string | undefined {
  if (!value || value.trim() === "") {
    return `${fieldName} is required`;
  }
  return undefined;
}
