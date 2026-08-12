package dto

import "time"

type CreateGroupRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	GroupAvatar string `json:"group_avatar"`
}

type GroupResponse struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	GroupAvatar string    `json:"group_avatar"`
	CreatorID   string    `json:"creator_id"`
	MemberCount int       `json:"member_count"`
	CreatedAt   time.Time `json:"created_at"`
}

type BrowseGroupsResponse struct {
	Groups     []GroupResponse `json:"groups"`
	NextCursor string          `json:"next_cursor,omitempty"`
	Limit      int             `json:"limit"`
}

type UpdateGroupRequest struct {
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
	GroupAvatar string `json:"group_avatar,omitempty"`
}

type GetGroupDetailsResponse struct {
	ID                string    `json:"id"`
	Title             string    `json:"title"`
	Description       string    `json:"description"`
	GroupAvatar       string    `json:"group_avatar"`
	CreatorID         string    `json:"creator_id"`
	CreatorNickname   string    `json:"creator_nickname"`
	CreatorAvatarPath string    `json:"creator_avatar_path"`
	MemberCount       int       `json:"member_count"`
	CreatedAt         time.Time `json:"created_at"`
}
