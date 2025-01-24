-- Create users table
CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    verification_token TEXT UNIQUE,
    reset_token TEXT UNIQUE,
    reset_token_expires DATETIME,
    verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    display_timestamp TEXT NOT NULL,
    duration TEXT NOT NULL,
    action TEXT NOT NULL,
    tags TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_email ON activities(user_email);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);