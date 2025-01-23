const CSRF_TOKEN_KEY = "csrf_token";

export const generateCsrfToken = (): string => {
  const token = crypto
    .getRandomValues(new Uint8Array(32))
    .reduce((acc, val) => acc + val.toString(16).padStart(2, "0"), "");

  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  return token;
};

export const validateCsrfToken = (token: string): boolean => {
  const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (!storedToken || token !== storedToken) {
    return false;
  }
  return true;
};

export const getCsrfToken = (): string | null => {
  return sessionStorage.getItem(CSRF_TOKEN_KEY);
};
