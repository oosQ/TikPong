CREATE TABLE group_invitations (
    group_id TEXT NOT NULL,
    invitee_id TEXT NOT NULL,
    inviter_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, invitee_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (invitee_id != inviter_id)
);

CREATE INDEX idx_group_invitations_invitee_id ON group_invitations(invitee_id);
