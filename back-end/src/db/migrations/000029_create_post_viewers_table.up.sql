CREATE TABLE post_viewers (
    post_id TEXT NOT NULL,
    viewer_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, viewer_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_post_viewers_viewer_id ON post_viewers(viewer_id);
