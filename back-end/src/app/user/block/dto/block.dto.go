package dto

import "time"

type BlockedUserResponse struct {
	UserID    string    `json:"user_id"`
	Nickname  string    `json:"nickname"`
	AvatarPath string   `json:"avatar_path"`
	BlockedAt time.Time `json:"blocked_at"`
}
