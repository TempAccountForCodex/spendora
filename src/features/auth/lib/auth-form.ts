type SignInFormValues = {
  email: string;
  password: string;
};

type SignUpFormValues = SignInFormValues & {
  name: string;
};

export type AuthFieldErrors = Partial<
  Record<"name" | "email" | "password", string>
>;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeAuthMessage(message: string | null | undefined) {
  return message?.trim().toLowerCase() ?? "";
}

export function validateSignInForm(values: SignInFormValues) {
  const errors: AuthFieldErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  }

  return errors;
}

export function validateSignUpForm(values: SignUpFormValues) {
  const errors: AuthFieldErrors = {};
  const trimmedName = values.name.trim();
  const trimmedEmail = values.email.trim();

  if (!trimmedName) {
    errors.name = "Full name is required.";
  } else if (trimmedName.length < 2) {
    errors.name = "Full name must be at least 2 characters.";
  }

  if (!trimmedEmail) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

export function mapAuthErrorMessage(message: string | null | undefined) {
  const normalizedMessage = message?.trim();

  if (!normalizedMessage) {
    return "Something went wrong. Please try again.";
  }

  const lowerMessage = normalizedMessage.toLowerCase();

  if (
    lowerMessage.includes("invalid credentials") ||
    lowerMessage.includes("invalid email or password")
  ) {
    return "Email or password is incorrect.";
  }

  if (
    lowerMessage.includes("user already exists") ||
    lowerMessage.includes("already exists") ||
    lowerMessage.includes("already registered")
  ) {
    return "An account with this email already exists.";
  }

  if (lowerMessage.includes("invalid email")) {
    return "Enter a valid email address.";
  }

  if (
    lowerMessage.includes("too small") ||
    lowerMessage.includes("password")
  ) {
    return "Please check your password and try again.";
  }

  if (lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
    return "Please check your internet connection and try again.";
  }

  return "Something went wrong. Please try again.";
}

export function isExistingAccountError(message: string | null | undefined) {
  const normalizedMessage = normalizeAuthMessage(message);

  return (
    normalizedMessage.includes("user already exists") ||
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("already registered")
  );
}

export function isInvalidCredentialsError(message: string | null | undefined) {
  const normalizedMessage = normalizeAuthMessage(message);

  return (
    normalizedMessage.includes("invalid credentials") ||
    normalizedMessage.includes("invalid email or password")
  );
}
