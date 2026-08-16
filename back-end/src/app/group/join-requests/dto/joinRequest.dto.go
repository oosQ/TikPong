package dto

import "time"

type JoinRequestResponse struct {
	ID                string    `json:"id"`
	GroupID           string    `json:"group_id"`
	GroupTitle        string    `json:"group_title"`
	GroupAvatar       string    `json:"group_avatar"`
	RequesterID       string    `json:"requester_id"`
	RequesterNickname string    `json:"requester_nickname"`
	AvatarPath        string    `json:"avatar_path"`
	RequesterStatus   string    `json:"requester_status"`
	CreatedAt         time.Time `json:"created_at"`
}

type ListJoinRequestsResponse struct {
	Requests   []JoinRequestResponse `json:"requests"`
	NextCursor string                `json:"next_cursor,omitempty"`
	Limit      int                   `json:"limit"`
}

type SentJoinRequestResponse struct {
	ID                 string    `json:"id"`
	GroupID            string    `json:"group_id"`
	GroupTitle         string    `json:"group_title"`
	GroupAvatar        string    `json:"group_avatar"`
	GroupCreatorID     string    `json:"group_creator_id"`
	GroupCreatorName   string    `json:"group_creator_name"`
	GroupCreatorAvatar string    `json:"group_creator_avatar"`
	Status             string    `json:"status"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type ListSentJoinRequestsResponse struct {
	Requests   []SentJoinRequestResponse `json:"requests"`
	NextCursor string                    `json:"next_cursor,omitempty"`
	Limit      int                       `json:"limit"`
}
