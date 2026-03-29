package dto

import "time"

type JoinRequestResponse struct {
	ID                string    `json:"id"`
	GroupID           string    `json:"group_id"`
	GroupTitle        string    `json:"group_title"`
	RequesterID       string    `json:"requester_id"`
	RequesterNickname string    `json:"requester_nickname"`
	AvatarPath        string    `json:"avatar_path"`
	CreatedAt         time.Time `json:"created_at"`
}
