package dto

import "time"

type BlockedUserResponse struct {
	UserID     string    `json:"user_id"`
	Nickname   string    `json:"nickname"`
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	AvatarPath string    `json:"avatar_path"`
	BlockedAt  time.Time `json:"blocked_at"`
}

type GetBlockedUsersResponse struct {
	Users      []BlockedUserResponse `json:"users"`
	NextCursor string                `json:"next_cursor,omitempty"`
	Limit      int                   `json:"limit"`
}
