CREATE TABLE follow_requests (
    requester_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (requester_id, target_id),
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (requester_id != target_id)
);
