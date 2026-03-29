package dto

import "time"

type CreateGroupRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type GroupResponse struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CreatorID   string    `json:"creator_id"`
	CreatedAt   time.Time `json:"created_at"`
}

type UpdateGroupRequest struct {
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
}

type GetGroupDetailsResponse struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CreatorID   string    `json:"creator_id"`
	CreatorNickname string    `json:"creator_nickname"`
	MemberCount int       `json:"member_count"`
	CreatedAt   time.Time `json:"created_at"`
}