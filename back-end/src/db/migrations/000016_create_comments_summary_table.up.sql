CREATE TABLE comments_summary (
    comment_id TEXT PRIMARY KEY,
    total_likes INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);
