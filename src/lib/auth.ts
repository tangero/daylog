import { openDB, type DBSchema } from "idb";

interface User {
  email: string;
  password: string; // In real app, this should be hashed
  firstName?: string;
  lastName?: string;
  verified?: boolean;
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
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const userData = await response.json();
    // Store session
    localStorage.setItem("user", JSON.stringify(userData));
  } catch (error) {
    console.error("Login error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Neplatné přihlašovací údaje",
    );
  }
};

export const logoutUser = () => {
  localStorage.removeItem("user");
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
      await db.put("users", {
        email: "demo@example.com",
        password: "demo123",
        firstName: "Demo",
        lastName: "User",
      });
    }
  } catch (error) {
    console.error("Failed to initialize auth:", error);
  }
};

export const getUserProfile = async (email: string) => {
  const db = await initAuthDB();
  const user = await db.get("users", email);

  if (!user) {
    throw new Error("User not found");
  }

  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
};

export const updateUserProfile = async ({
  email,
  firstName,
  lastName,
  currentPassword,
  newPassword,
}: {
  email: string;
  firstName?: string;
  lastName?: string;
  currentPassword?: string;
  newPassword?: string;
}) => {
  try {
    // If changing password, verify current password first
    if (currentPassword && newPassword) {
      const verifyResponse = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: currentPassword }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Nesprávné současné heslo");
      }
    }

    // Update user profile
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        ...(newPassword ? { password: newPassword } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    // Update local storage with new user data
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userData = JSON.parse(userStr);
      const updatedUser = {
        ...userData,
        email,
        firstName,
        lastName,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  } catch (error) {
    console.error("Update profile error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Nepodařilo se aktualizovat profil",
    );
  }
};
