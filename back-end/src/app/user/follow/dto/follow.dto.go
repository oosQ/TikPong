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

type GetFollowRequestsResponse struct {
	Requests   []FollowRequestReceivedResponse `json:"requests"`
	NextCursor string                          `json:"next_cursor,omitempty"`
	Limit      int                             `json:"limit"`
}

type FollowRequestResponse struct {
	RequesterID string `json:"requester_id"`
	TargetID    string `json:"target_id"`
	Status      string `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	Nickname    string `json:"nickname"`
	AvatarPath  string `json:"avatar_path"`
}

type GetSentFollowRequestsResponse struct {
	Requests   []FollowRequestResponse `json:"requests"`
	NextCursor string                  `json:"next_cursor,omitempty"`
	Limit      int                     `json:"limit"`
}

type FollowInfoResponse struct {
	UserID     string `json:"user_id"`
	Nickname   string `json:"nickname"`
	AvatarPath string `json:"avatar_path"`
}

type GetFollowInfoResponse struct {
	Users      []FollowInfoResponse `json:"users"`
	NextCursor string               `json:"next_cursor,omitempty"`
	Limit      int                  `json:"limit"`
}

