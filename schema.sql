CREATE TABLE users (
  email TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires DATETIME
);