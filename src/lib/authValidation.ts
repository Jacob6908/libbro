export const EMAIL_PATTERN = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+";
export const EMAIL_REGEX = new RegExp(`^${EMAIL_PATTERN}$`);

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = new RegExp(
  `^(?=.*\\d)(?=.*[^A-Za-z0-9]).{${PASSWORD_MIN_LENGTH},}$`
);

export const PASSWORD_REQUIREMENTS = [
  `At least ${PASSWORD_MIN_LENGTH} characters`,
  "At least one number",
  "At least one special character",
];

export const PASSWORD_REQUIREMENT_CHECKS = [
  {
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    isMet: (password: string) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    label: "At least one number",
    isMet: (password: string) => /\d/.test(password),
  },
  {
    label: "At least one special character",
    isMet: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
];

export function isValidEmail(email: string) {
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPassword(password: string) {
  return PASSWORD_REGEX.test(password);
}
