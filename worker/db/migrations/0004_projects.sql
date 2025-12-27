-- Migration: Add projects table for hashtag metadata
-- Allows users to add name and description to hashtags

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  name TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, tag_name)
);

CREATE INDEX idx_projects_user_tag ON projects(user_id, tag_name);
