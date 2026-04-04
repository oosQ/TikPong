package dto

import "time"

type CreateGroupCommentRequest struct {
	Content   string `json:"content"`
	ImagePath string `json:"image_path,omitempty"`
}

type GroupCommentResponse struct {
	ID          string    `json:"id"`
	GroupPostID string    `json:"group_post_id"`
	UserID      string    `json:"user_id"`
	Content     string    `json:"content"`
	ImagePath   string    `json:"image_path"`
	Nickname    string    `json:"nickname"`
	AvatarPath  string    `json:"avatar_path"`
	CreatedAt   time.Time `json:"created_at"`
}

type ListGroupCommentsResponse struct {
	Comments   []GroupCommentResponse `json:"comments"`
	NextCursor string                 `json:"next_cursor,omitempty"`
	Limit      int                    `json:"limit"`
}
