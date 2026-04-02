CREATE TABLE groups (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    avatar_path TEXT,
    description TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_groups_creator_id ON groups(creator_id);
