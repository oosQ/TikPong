CREATE TABLE sessions (
    id TEXT NOT NULL UNIQUE PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    email TEXT NOT NULL,
	avatar_path TEXT Not NULL,
    role TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);