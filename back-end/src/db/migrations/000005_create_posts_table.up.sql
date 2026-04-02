CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_path TEXT,
    user_id TEXT NOT NULL,
    privacy TEXT CHECK (privacy IN ('public', 'almost_private', 'private')) NOT NULL DEFAULT 'public',
    is_edited INTEGER NOT NULL DEFAULT 0,
    edited_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);