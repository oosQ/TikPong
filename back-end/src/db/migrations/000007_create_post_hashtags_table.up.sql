CREATE TABLE post_hashtags (
    post_id TEXT NOT NULL,
    hashtag_id TEXT NOT NULL,
    PRIMARY KEY (post_id, hashtag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (hashtag_id) REFERENCES hashtags(id)
);
