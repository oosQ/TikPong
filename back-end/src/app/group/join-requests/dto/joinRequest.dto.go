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
	CreatedAt         time.Time `json:"created_at"`
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
