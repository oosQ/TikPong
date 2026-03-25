CREATE TABLE user_summary (
    user_id TEXT PRIMARY KEY,
    total_posts INTEGER NOT NULL DEFAULT 0,
    total_post_views INTEGER NOT NULL DEFAULT 0,
    total_likes INTEGER NOT NULL DEFAULT 0,
    total_followers INTEGER NOT NULL DEFAULT 0,
    total_following INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
