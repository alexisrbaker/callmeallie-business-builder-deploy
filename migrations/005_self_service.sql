PRAGMA foreign_keys = ON;
ALTER TABLE users ADD COLUMN is_owner INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS password_reset_tokens(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,token_hash TEXT NOT NULL UNIQUE,expires_at TEXT NOT NULL,used_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS connected_services(id TEXT PRIMARY KEY,service_type TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'disconnected',display_name TEXT,configuration TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit_events(id TEXT PRIMARY KEY,user_id TEXT,event_type TEXT NOT NULL,details TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id,expires_at);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id,completed_at);
