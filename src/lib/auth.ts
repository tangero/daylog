import { openDB, type DBSchema } from "idb";

interface User {
  email: string;
  password: string; // In real app, this should be hashed
}

interface AuthDB extends DBSchema {
  users: {
    key: string;
    value: User;
  };
}

const DB_NAME = "auth-db";
const DB_VERSION = 1;

const initAuthDB = async () => {
  return openDB<AuthDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore("users", { keyPath: "email" });
    },
  });
};

export const registerUser = async (email: string, password: string) => {
  const db = await initAuthDB();
  const existingUser = await db.get("users", email);

  if (existingUser) {
    throw new Error("User already exists");
  }

  await db.put("users", { email, password });
};

export const loginUser = async (email: string, password: string) => {
  const db = await initAuthDB();
  const user = await db.get("users", email);

  if (!user || user.password !== password) {
    throw new Error("Invalid email or password");
  }

  // Store session
  sessionStorage.setItem("user", email);
};

export const logoutUser = () => {
  sessionStorage.removeItem("user");
};

export const getCurrentUser = () => {
  return sessionStorage.getItem("user");
};

// Register default user if none exists
export const initializeAuth = async () => {
  try {
    const db = await initAuthDB();
    const defaultUser = await db.get("users", "demo@example.com");

    if (!defaultUser) {
      await registerUser("demo@example.com", "demo123");
    }
  } catch (error) {
    console.error("Failed to initialize auth:", error);
  }
};
