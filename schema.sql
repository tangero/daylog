DROP TABLE IF EXISTS activities;
CREATE TABLE activities (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    display_timestamp TEXT NOT NULL,
    duration TEXT NOT NULL,
    action TEXT NOT NULL,
    tags TEXT NOT NULL, -- JSON array as string
    user_email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    email TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);