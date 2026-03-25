package dto

import "time"

type FollowRequestReceivedResponse struct {
	FromUserID string    `json:"from_user_id"`
	TargetID   string    `json:"target_id"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	Nickname   string    `json:"nickname"`
	AvatarPath string    `json:"avatar_path"`
}

type FollowRequestResponse struct {
	RequesterID string `json:"requester_id"`
	TargetID    string `json:"target_id"`
	Status      string `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	Nickname    string `json:"nickname"`
	AvatarPath  string `json:"avatar_path"`
}

type FollowInfoResponse struct {
	UserID     string `json:"user_id"`
	Nickname   string `json:"nickname"`
	AvatarPath string `json:"avatar_path"`
}

