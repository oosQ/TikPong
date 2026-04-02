package dto

import "time"

type GroupPostResponse struct {
	ID         string    `json:"id"`
	GroupID    string    `json:"group_id"`
	UserID     string    `json:"user_id"`
	Title      string    `json:"title"`
	Content    string    `json:"content"`
	ImagePath  string    `json:"image_path"`
	Nickname   string    `json:"nickname"`
	AvatarPath string    `json:"avatar_path"`
	CreatedAt  time.Time `json:"created_at"`
}

type CreateGroupPostRequest struct {
	Title     string `json:"title"`
	Content   string `json:"content"`
	ImagePath string `json:"image_path,omitempty"`
}
