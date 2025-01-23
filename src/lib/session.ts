import jwt from "jsonwebtoken";

const JWT_SECRET = "your-secret-key"; // In production, use environment variable
const TOKEN_EXPIRY = "24h";

export interface SessionUser {
  email: string;
  exp?: number;
}

export const createSession = (user: { email: string }): string => {
  return jwt.sign({ email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
};

export const verifySession = (token: string): SessionUser | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
};

export const getStoredSession = (): string | null => {
  return localStorage.getItem("auth_token");
};

export const storeSession = (token: string): void => {
  localStorage.setItem("auth_token", token);
};

export const clearSession = (): void => {
  localStorage.removeItem("auth_token");
};
