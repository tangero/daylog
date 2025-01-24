-- Migration number: 0000 	 2024-01-24T11:00:00.000Z
-- Description: Initial schema

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  email TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS activities;
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  display_timestamp TEXT NOT NULL,
  duration TEXT NOT NULL,
  action TEXT NOT NULL,
  tags TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_email) REFERENCES users(email)
);